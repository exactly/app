import { ErrorCode } from '@ethersproject/logger';
import { goerli } from 'wagmi/chains';
import type { Options } from '@sentry/types';
import MarketETHRouter from '@exactly-protocol/protocol/deployments/goerli/MarketETHRouter.json';

type ErrorMap = { [key: string]: RegExp[] };

const ignored: ErrorMap = {
  TypeError: [/network request failed/gi, /NetworkError when attempting to fetch resource/gi],
  Error: [/websocket error/gi, /transaction.*rejected/gi],
  AbortError: [/aborted/gi],
  ChunkLoadError: [/loading chunk/gi],
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

    if (!('code' in error) || !('transaction' in error)) {
      return event;
    }

    // See https://discordapp.com/channels/846682395553824808/985912903880302632/1067449799038742548
    const { transaction, code } = error as { code: string; transaction: { to: string } };
    if (code === ErrorCode.UNPREDICTABLE_GAS_LIMIT && transaction.to === MarketETHRouter.address) {
      return null;
    }
  }

  return event;
};
