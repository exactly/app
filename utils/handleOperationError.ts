import { ErrorCode } from '@ethersproject/logger';
import { captureException } from '@sentry/nextjs';
import ErrorInterface from './ErrorInterface';

export default (error: any) => {
  if (!error?.code) {
    captureException(error);
    return 'There was an error, please try again';
  }

  switch (error?.code) {
    case ErrorCode.ACTION_REJECTED:
      return 'Transaction rejected by user';
    case ErrorCode.UNSUPPORTED_OPERATION:
      return 'Unsupported operation';
    case ErrorCode.INSUFFICIENT_FUNDS:
      return 'Insufficient ether balance';
    case ErrorCode.NONCE_EXPIRED:
      return 'Nonce expired';
    case ErrorCode.UNPREDICTABLE_GAS_LIMIT: {
      if (!error?.error?.data?.originalError?.data) {
        captureException(error);
        return 'There was an error, please try again';
      }

      const { name, args } = ErrorInterface.parseError(error.error.data.originalError.data);

      switch (name) {
        case 'InsufficientAccountLiquidity':
          return 'There is not enough liquidity in your account';
        case 'InsufficientProtocolLiquidity':
          return 'There is not enough liquidity in the protocol';
        case 'Disagreement':
          return 'Not enough slippage';
        case 'InvalidPrice':
          captureException(error);
          return 'Invalid price';
        case 'ZeroRepay':
          return "Can't repay 0";
        case 'ZeroWithdraw':
          return "Can't withdraw 0";
        case 'UtilizationExceeded':
          return 'Utilization rate exceeded';

        case 'Error':
          switch (args[0]) {
            case 'TRANSFER_FROM_FAILED':
              return 'Insufficient assets or lack of approval, please try again';
            case 'ZERO_SHARES':
              return 'Cannot deposit 0';
            case 'ZERO_ASSETS':
              return 'Cannot withdraw 0';
          }
      }
    }
  }

  // if none of the above, report to sentry
  captureException(error);
  return 'There was an error, please try again';
};
