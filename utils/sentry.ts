import type { Options } from '@sentry/types';

type ErrorMap = { [key: string]: RegExp[] };

const ignored: ErrorMap = {
  TypeError: [/^Network request failed$/, /^NetworkError when attempting to fetch resource$/],
  Error: [/^websocket error 1006:/],
  AbortError: [/^Aborted$/],
  ChunkLoadError: [/^Loading chunk .* failed\./],
};

const isIgnored = (err: Error): boolean => {
  return ignored[err.name].some((msg) => msg.test(err.message));
};

export const beforeSend: Options['beforeSend'] = (event, hint) => {
  const { originalException } = hint;

  if (originalException && originalException instanceof Error) {
    if (isIgnored(originalException)) {
      return null;
    }
  }

  return event;
};
