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
        this.keyPair = existing.keyPair;
        this.publicJwk = existing.publicJwk;
        return;
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

      // Store in IndexedDB
      const writeTx = db.transaction('keys', 'readwrite');
      writeTx.objectStore('keys').put({
        id: 'dpop_keypair',
        keyPair,
        publicJwk: cleanJwk
      });
    } catch (err) {
      console.warn('[DPoPCryptoService] Failed to initialize persistent DPoP keys:', err);
    }
  }

  /**
   * Generates a signed RFC 9449 DPoP proof mini-JWT for the given HTTP method and URL.
   */
  public async generateDPoPProof(method: string, url: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return null;
    }

    if (this.keyPromise) {
      await this.keyPromise;
    }

    if (!this.keyPair || !this.publicJwk) {
      return null;
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
        this.keyPair.privateKey,
        new TextEncoder().encode(signingInput)
      );

      const signatureB64 = base64UrlEncode(signatureBuffer);
      return `${signingInput}.${signatureB64}`;
    } catch (err) {
      console.warn('[DPoPCryptoService] Failed to generate DPoP proof:', err);
      return null;
    }
  }
}
