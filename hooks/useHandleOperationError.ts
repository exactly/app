import { useCallback } from 'react';
import { goerli } from 'wagmi/chains';
import { ErrorCode } from '@ethersproject/logger';
import { captureException as sentryCaptureException } from '@sentry/nextjs';

import { useOperationContext } from 'contexts/OperationContext';
import { useWeb3 } from './useWeb3';
import handleOperationError from 'utils/handleOperationError';

type HandleOperationErrorFunc = (
  exception: Parameters<typeof handleOperationError>[0],
) => ReturnType<typeof handleOperationError>;

export default function useHandleOperationError(): HandleOperationErrorFunc {
  const { chain } = useWeb3();
  const { symbol, operation } = useOperationContext();

  const captureException = useCallback<typeof sentryCaptureException>(
    (exception) => {
      if (
        chain?.id === goerli.id &&
        symbol === 'WETH' &&
        ['withdraw', 'withdrawAtMaturity', 'borrow', 'borrowAtMaturity'].includes(operation) &&
        exception &&
        exception?.code &&
        exception?.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT
      ) {
        return '';
      }

      return sentryCaptureException(exception);
    },
    [chain, symbol, operation],
  );

  return useCallback<HandleOperationErrorFunc>(
    (exception) => handleOperationError(exception, captureException),
    [captureException],
  );
}
