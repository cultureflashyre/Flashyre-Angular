import type { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

/** Prints one "@@QA {json}" line per event so the Test Lab tab can draw a progress bar. */
function emit(o: Record<string, unknown>) { process.stdout.write(`@@QA ${JSON.stringify(o)}\n`); }

export default class ProgressReporter implements Reporter {
  onBegin(_c: FullConfig, suite: Suite) { emit({ type: 'begin', total: suite.allTests().length }); }
  onTestBegin(t: TestCase) {
    emit({ type: 'start', title: t.title, project: t.parent.project()?.name ?? '', file: t.location.file.split(/[\\/]/).pop() });
  }
  onTestEnd(t: TestCase, r: TestResult) {
    emit({ type: 'end', title: t.title, project: t.parent.project()?.name ?? '', status: r.status, ms: r.duration,
           error: r.status === 'failed' || r.status === 'timedOut' ? (r.error?.message ?? '').split('\n')[0].slice(0, 240) : undefined });
  }
  onEnd() { emit({ type: 'done' }); }
  printsToStdio() { return false; }
}
