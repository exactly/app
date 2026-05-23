import type { init } from '@sentry/nextjs';

type ErrorMap = { [key: string]: RegExp[] };

const ignored: ErrorMap = {
  TypeError: [/^Network request failed$/, /^NetworkError when attempting to fetch resource$/],
  Error: [/^websocket error 1006:/],
  AbortError: [/^Aborted$/],
  ChunkLoadError: [/^Loading chunk .* failed\./],
};

const isIgnored = (err: Error): boolean => {
  return Boolean(ignored[err.name]?.some((msg) => msg.test(err.message)));
};

export const beforeSend: NonNullable<Parameters<typeof init>[0]>['beforeSend'] = async (event, hint) => {
  const { originalException } = hint;

  if (originalException && originalException instanceof Error) {
    if (isIgnored(originalException)) {
      return null;
    }
  }

  return event;
};
