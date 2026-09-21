// src/app/services/dpop-crypto.service.ts
import { Injectable } from '@angular/core';

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str));
}

@Injectable({
  providedIn: 'root'
})
export class DPoPCryptoService {
  private keyPair: CryptoKeyPair | null = null;
  private publicJwk: JsonWebKey | null = null;
  private keyPromise: Promise<void> | null = null;
  private keyInitFailed = false;

  constructor() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      this.keyPromise = this.initKey();
    }
  }

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('flashyre_dpop_db', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes the stored DPoP key pair from IndexedDB.
   * Used when the stored key becomes unusable (e.g., Safari CryptoKey detachment bug).
   */
  private async clearStoredKey(): Promise<void> {
    try {
      const db = await this.openDb();
      const tx = db.transaction('keys', 'readwrite');
      tx.objectStore('keys').delete('dpop_keypair');
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      console.warn('[DPoPCryptoService] Cleared stale DPoP key from IndexedDB.');
    } catch (err) {
      console.warn('[DPoPCryptoService] Failed to clear IndexedDB key:', err);
    }
  }

  /**
   * Generates a fresh ECDSA P-256 key pair in-memory (without persisting to IndexedDB).
   * Used as a fallback when IndexedDB keys are corrupted/stale.
   */
  private async generateInMemoryKey(): Promise<void> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false, // Private key is non-extractable
      ['sign']
    );

    const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const cleanJwk: JsonWebKey = {
      kty: publicJwk.kty,
      crv: publicJwk.crv,
      x: publicJwk.x,
      y: publicJwk.y
    };

    this.keyPair = keyPair;
    this.publicJwk = cleanJwk;
    console.log('[DPoPCryptoService] Generated fresh in-memory DPoP key pair.');
  }

  private async initKey(): Promise<void> {
    try {
      const db = await this.openDb();
      const existing = await new Promise<any>((resolve) => {
        const tx = db.transaction('keys', 'readonly');
        const req = tx.objectStore('keys').get('dpop_keypair');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (existing && existing.keyPair) {
        // Validate the retrieved key by attempting a test sign operation.
        // Safari iOS can store CryptoKey objects in IndexedDB but they may
        // become "detached" (non-functional) after page reload.
        try {
          const testData = new TextEncoder().encode('dpop_key_validation_test');
          await window.crypto.subtle.sign(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            existing.keyPair.privateKey,
            testData
          );
          // Key is valid and functional
          this.keyPair = existing.keyPair;
          this.publicJwk = existing.publicJwk;
          return;
        } catch (signErr) {
          // Key is stale/detached — clear it and regenerate
          console.warn('[DPoPCryptoService] Stored CryptoKey failed validation sign test, regenerating:', signErr);
          await this.clearStoredKey();
        }
      }

      // Generate ECDSA P-256 key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false, // Private key is non-extractable from hardware/browser
        ['sign']
      );

      const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      // Clean up public JWK to only standard fields
      const cleanJwk: JsonWebKey = {
        kty: publicJwk.kty,
        crv: publicJwk.crv,
        x: publicJwk.x,
        y: publicJwk.y
      };

      this.keyPair = keyPair;
      this.publicJwk = cleanJwk;

      // Try to persist in IndexedDB (best-effort; Safari may fail)
      try {
        const writeTx = db.transaction('keys', 'readwrite');
        writeTx.objectStore('keys').put({
          id: 'dpop_keypair',
          keyPair,
          publicJwk: cleanJwk
        });
      } catch (storeErr) {
        console.warn('[DPoPCryptoService] Failed to persist DPoP key to IndexedDB (will use in-memory):', storeErr);
      }
    } catch (err) {
      console.warn('[DPoPCryptoService] Failed to initialize persistent DPoP keys, falling back to in-memory:', err);
      // Fallback: generate in-memory key pair so DPoP still works this session
      try {
        await this.generateInMemoryKey();
      } catch (fallbackErr) {
        console.error('[DPoPCryptoService] In-memory key generation also failed:', fallbackErr);
        this.keyInitFailed = true;
      }
    }
  }

  /**
   * Generates a signed RFC 9449 DPoP proof mini-JWT for the given HTTP method and URL.
   * Returns null if crypto APIs are unavailable — the interceptor must treat null as
   * "omit DPoP header entirely" (not empty string).
   */
  public async generateDPoPProof(method: string, url: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return null;
    }

    if (this.keyPromise) {
      await this.keyPromise;
      this.keyPromise = null; // Only await once
    }

    if (!this.keyPair || !this.publicJwk) {
      if (this.keyInitFailed) {
        return null; // Don't retry if init fundamentally failed
      }
      // Try one more time with in-memory generation
      try {
        await this.generateInMemoryKey();
      } catch {
        this.keyInitFailed = true;
        return null;
      }
    }

    try {
      // Normalize URL (strip query params and fragment per RFC 9449)
      let normalizedHtu = url;
      try {
        const parsed = new URL(url, window.location.origin);
        normalizedHtu = parsed.origin + parsed.pathname;
      } catch {
        normalizedHtu = url.split('?')[0].split('#')[0];
      }

      const header = {
        typ: 'dpop+jwt',
        alg: 'ES256',
        jwk: this.publicJwk
      };

      const payload = {
        jti: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2),
        htm: method.toUpperCase(),
        htu: normalizedHtu,
        iat: Math.floor(Date.now() / 1000)
      };

      const headerB64 = stringToBase64Url(JSON.stringify(header));
      const payloadB64 = stringToBase64Url(JSON.stringify(payload));
      const signingInput = `${headerB64}.${payloadB64}`;

      const signatureBuffer = await window.crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' }
        },
        this.keyPair!.privateKey,
        new TextEncoder().encode(signingInput)
      );

      const signatureB64 = base64UrlEncode(signatureBuffer);
      return `${signingInput}.${signatureB64}`;
    } catch (err) {
      console.warn('[DPoPCryptoService] Failed to generate DPoP proof, attempting key regeneration:', err);

      // The signing key may have become detached (Safari iOS bug).
      // Clear stale key and regenerate in-memory for this session.
      try {
        await this.clearStoredKey();
        await this.generateInMemoryKey();
        // Don't retry the proof generation here to avoid infinite recursion.
        // The next request will use the fresh key.
        console.log('[DPoPCryptoService] Key regenerated. Next request will use fresh key.');
      } catch (regenErr) {
        console.error('[DPoPCryptoService] Key regeneration failed:', regenErr);
        this.keyInitFailed = true;
      }

      return null; // This request proceeds without DPoP; next one should work
    }
  }
}
