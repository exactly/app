import { ErrorCode } from '@ethersproject/logger';
import { goerli } from 'wagmi/chains';
import type { Options } from '@sentry/types';
import MarketETHRouter from '@exactly-protocol/protocol/deployments/goerli/MarketETHRouter.json';

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
  const { originalException, syntheticException } = hint;

  if (originalException && originalException instanceof Error) {
    if (isIgnored(originalException)) {
      return null;
    }
  }

  if (syntheticException) {
    const error = event.contexts?.Error;
    const chain = event.contexts?.chain;
    if (!error || !chain || chain.id !== goerli.id) {
      return event;
    }

    if (!error.transaction || !error.code) {
      return event;
    }

    const { to } = error.transaction as { to: string };
    if (error.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT && to === MarketETHRouter.address) {
      return null;
    }
  }

  return event;
};
