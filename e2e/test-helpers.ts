import { Page, TestInfo } from '@playwright/test';

export interface PerformanceMetric {
  name: string;
  durationMs: number;
  thresholdMs: number;
  passed: boolean;
}

/**
 * Utility to listen for and collect browser console messages, errors, and unhandled page exceptions.
 */
export function setupErrorAndConsoleListener(page: Page) {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const pageErrors: Error[] = [];
  const failedRequests: { url: string; method: string; failure: string | null }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(`[Console Warn]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (exception) => {
    pageErrors.push(exception);
  });

  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown request failure',
    });
  });

  return {
    consoleErrors,
    consoleWarnings,
    pageErrors,
    failedRequests,
    printSummary: () => {
      if (consoleErrors.length > 0) {
        console.log(`\n--- Collected ${consoleErrors.length} Console Errors ---`);
        consoleErrors.forEach((err) => console.log(`  ${err}`));
      }
      if (pageErrors.length > 0) {
        console.log(`\n--- Collected ${pageErrors.length} Page Exceptions ---`);
        pageErrors.forEach((err) => console.log(`  ${err.message}\n  Stack: ${err.stack}`));
      }
      if (failedRequests.length > 0) {
        console.log(`\n--- Collected ${failedRequests.length} Failed Network Requests ---`);
        failedRequests.forEach((req) => console.log(`  ${req.method} ${req.url} -> ${req.failure}`));
      }
    },
  };
}

/**
 * Utility to measure execution time of any async operation or network call.
 */
export async function measureResponseTime<T>(
  actionName: string,
  thresholdMs: number,
  action: () => Promise<T>
): Promise<{ result: T; metric: PerformanceMetric }> {
  const start = performance.now();
  const result = await action();
  const end = performance.now();
  const durationMs = Math.round(end - start);

  const metric: PerformanceMetric = {
    name: actionName,
    durationMs,
    thresholdMs,
    passed: durationMs <= thresholdMs,
  };

  return { result, metric };
}
