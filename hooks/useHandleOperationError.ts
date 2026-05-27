import { useCallback } from 'react';
import { optimismSepolia } from 'viem/chains';
import { captureException as sentryCaptureException } from '@sentry/nextjs';

import { useOperationContext } from 'contexts/OperationContext';
import handleOperationError from 'utils/handleOperationError';
import { defaultChain } from 'utils/client';

type HandleOperationErrorFunc = (
  exception: Parameters<typeof handleOperationError>[0],
) => ReturnType<typeof handleOperationError>;

export default function useHandleOperationError(): HandleOperationErrorFunc {
  const { symbol, operation } = useOperationContext();

  const captureException = useCallback<typeof sentryCaptureException>(
    (exception) => {
      if (
        defaultChain.id === optimismSepolia.id &&
        symbol === 'WETH' &&
        ['withdraw', 'withdrawAtMaturity', 'borrow', 'borrowAtMaturity'].includes(operation) &&
        exception &&
        typeof exception === 'object' &&
        'code' in exception &&
        exception.code === 'UNPREDICTABLE_GAS_LIMIT'
      ) {
        return '';
      }

      return sentryCaptureException(exception);
    },
    [symbol, operation],
  );

  return useCallback<HandleOperationErrorFunc>(
    (exception) => handleOperationError(exception, captureException),
    [captureException],
  );
}
