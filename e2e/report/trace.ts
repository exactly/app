import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import type { FullConfig, FullResult, Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';

type Step = {
  category: string;
  children: number;
  duration: number;
  error: boolean;
  path: string;
  start: number;
  title: string;
};

type Run = {
  duration: number;
  file: string;
  parallelIndex: number;
  playwrightDuration: number;
  retry: number;
  start: number;
  status: string;
  steps: Step[];
  title: string;
  workerIndex: number;
};

type TraceEvent =
  | {
      args?: Record<string, unknown>;
      cat: string;
      name: string;
      ph: 'B' | 'E';
      pid: number;
      tid: number;
      ts: number;
    }
  | {
      args?: Record<string, unknown>;
      name: string;
      ph: 'M';
      pid: number;
      tid?: number;
    };

const stepKind = ({ category, title }: Pick<Step, 'category' | 'title'>) =>
  category === 'test.step' && title.includes(':') ? title.slice(0, title.indexOf(':')) : category;

const toStep = (step: TestStep, origin: number): Step => ({
  category: step.category,
  children: step.steps.length,
  duration: step.duration,
  error: Boolean(step.error),
  path: step.titlePath().filter(Boolean).join(' > ') || step.title,
  start: Math.max(0, step.startTime.getTime() - origin),
  title: step.title,
});

const toSteps = (steps: TestStep[], origin: number): Step[] =>
  steps.flatMap((step) => [toStep(step, origin), ...toSteps(step.steps, origin)]);

const us = (value: number) => Math.round(value * 1_000);

const eventDuration = (event: TraceEvent & { order: number }) =>
  typeof event.args?.duration === 'number' ? event.args.duration : 0;

export default class TraceReporter implements Reporter {
  private rootDir = process.cwd();
  private runs: Run[] = [];
  private result?: FullResult;
  private traceFile: string;

  constructor(options: { traceFile?: string } = {}) {
    this.traceFile = resolve(options.traceFile ?? 'test-results/e2e-trace.json');
  }

  printsToStdio() {
    return false;
  }

  onBegin(config: FullConfig) {
    this.rootDir = config.rootDir;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const steps = toSteps(result.steps, result.startTime.getTime());
    this.runs.push({
      duration: Math.max(result.duration, ...steps.map(({ duration, start }) => start + duration)),
      file: relative(this.rootDir, test.location.file),
      parallelIndex: result.parallelIndex,
      playwrightDuration: result.duration,
      retry: result.retry,
      start: result.startTime.getTime(),
      status: result.status ?? 'unknown',
      steps,
      title: test.titlePath().filter(Boolean).slice(2).join(' > ') || test.title,
      workerIndex: result.workerIndex,
    });
  }

  onEnd(result: FullResult) {
    this.result = result;
  }

  async onExit() {
    const result = this.result;
    if (!result) return;

    const origin = this.runs.length ? Math.min(...this.runs.map(({ start }) => start)) : result.startTime.getTime();
    const traceEvents: (TraceEvent & { order: number })[] = [];

    const addEvent = (event: TraceEvent) => {
      traceEvents.push({ ...event, order: traceEvents.length });
    };

    addEvent({ name: 'process_name', ph: 'M', pid: 1, args: { name: 'Playwright E2E' } });
    for (const [index, run] of this.runs.entries()) {
      addEvent({
        name: 'thread_name',
        ph: 'M',
        pid: 1,
        tid: index + 1,
        args: { name: `${run.title} · ${run.file.replace(/^e2e\/specs\//, '')}` },
      });
    }

    const addSlice = (
      run: Run,
      index: number,
      start: number,
      end: number,
      title: string,
      category: string,
      kind: string,
      path: string,
      error: boolean,
    ) => {
      const args = {
        category,
        duration: end - start,
        error,
        file: run.file,
        kind,
        path,
        parallelIndex: run.parallelIndex,
        playwrightDuration: run.playwrightDuration,
        retry: run.retry,
        status: run.status,
        test: run.title,
        workerIndex: run.workerIndex,
      };
      const startUs = us(run.start - origin + start);
      const endUs = Math.max(startUs + 1, us(run.start - origin + end));
      addEvent({
        name: title,
        cat: category,
        ph: 'B',
        pid: 1,
        tid: index + 1,
        ts: startUs,
        args,
      });
      addEvent({
        name: title,
        cat: category,
        ph: 'E',
        pid: 1,
        tid: index + 1,
        ts: endUs,
        args,
      });
    };

    for (const [index, run] of this.runs.entries()) {
      addSlice(run, index, 0, run.duration, run.title, 'test', 'test', run.title, run.status !== 'passed');

      for (const step of [...run.steps].sort((a, b) => a.start - b.start || b.duration - a.duration)) {
        const start = Math.max(0, step.start);
        const end = Math.min(run.duration, step.start + step.duration);
        if (end <= start) continue;
        addSlice(run, index, start, end, step.title, step.category, stepKind(step), step.path, step.error);
      }

      for (const parent of [
        { duration: run.duration, path: run.title, start: 0 },
        ...run.steps.filter(({ children }) => children > 0),
      ]) {
        const end = Math.min(run.duration, parent.start + parent.duration);
        let cursor = Math.min(run.duration, Math.max(0, parent.start));
        for (const step of run.steps
          .filter(({ path }) => path.slice(0, path.lastIndexOf(' > ')) === parent.path)
          .sort((a, b) => a.start - b.start || b.duration - a.duration)) {
          const start = Math.min(end, Math.max(cursor, step.start));
          if (start - cursor > 1) {
            addSlice(
              run,
              index,
              cursor,
              start,
              'unstepped time',
              'gap',
              'gap',
              `${parent.path} > unstepped time`,
              false,
            );
          }
          cursor = Math.max(cursor, Math.min(end, step.start + step.duration));
        }
        if (end - cursor > 1) {
          addSlice(run, index, cursor, end, 'unstepped time', 'gap', 'gap', `${parent.path} > unstepped time`, false);
        }
      }
    }

    traceEvents.sort((a, b) => {
      if (!('ts' in a) || !('ts' in b)) return ('ts' in a ? a.ts : -1) - ('ts' in b ? b.ts : -1) || a.order - b.order;
      if (a.ts !== b.ts) return a.ts - b.ts;
      if (a.ph === 'E' && b.ph === 'E') return eventDuration(a) - eventDuration(b) || b.order - a.order;
      if (a.ph === 'B' && b.ph === 'B') return eventDuration(b) - eventDuration(a) || a.order - b.order;
      if (a.ph !== b.ph) return a.ph === 'E' ? -1 : 1;
      return a.order - b.order;
    });
    await mkdir(dirname(this.traceFile), { recursive: true });
    await writeFile(
      this.traceFile,
      `${JSON.stringify(
        {
          traceEvents: traceEvents.map(({ order: _order, ...event }) => event),
          displayTimeUnit: 'ms',
          otherData: {
            generatedAt: new Date().toISOString(),
            status: result.status,
            tracedDuration: Math.max(0, ...this.runs.map(({ duration, start }) => start - origin + duration)),
            wallDuration: result.duration,
            results: this.runs.length,
          },
        },
        undefined,
        2,
      )}\n`,
    );
  }
}
