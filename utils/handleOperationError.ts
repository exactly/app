import { ErrorCode } from '@ethersproject/logger';
import { captureException as sentryCaptureException } from '@sentry/nextjs';
import ErrorInterface from './ErrorInterface';
import i18n from 'i18n';

const defaultErr = i18n.t('There was an error, please try again');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (error: any, captureException: typeof sentryCaptureException = sentryCaptureException): string => {
  if (!error?.code) {
    captureException(error);
    return defaultErr;
  }

  switch (error.code) {
    case ErrorCode.ACTION_REJECTED:
      return i18n.t('Transaction rejected by user');
    case ErrorCode.TRANSACTION_REPLACED:
      return i18n.t('Transaction cancelled by user');
    case ErrorCode.UNSUPPORTED_OPERATION:
      return i18n.t('Unsupported operation');
    case ErrorCode.INSUFFICIENT_FUNDS:
      return i18n.t('Insufficient ether balance');
    case ErrorCode.NONCE_EXPIRED:
      return i18n.t('Nonce expired');
    case ErrorCode.UNPREDICTABLE_GAS_LIMIT: {
      if (!error?.error?.data?.originalError?.data) {
        break;
      }

      const { name, args } = ErrorInterface.parseError(error.error.data.originalError.data);

      switch (name) {
        case 'InsufficientAccountLiquidity':
          return i18n.t('There is not enough liquidity in your account');
        case 'InsufficientProtocolLiquidity':
          return i18n.t('There is not enough liquidity in the protocol');
        case 'Disagreement':
          return i18n.t('Not enough slippage');
        case 'InvalidPrice':
          captureException(error);
          return i18n.t('Invalid price');
        case 'ZeroDeposit':
          return i18n.t('Cannot deposit 0');
        case 'ZeroWithdraw':
          return i18n.t('Cannot withdraw 0');
        case 'ZeroRepay':
          return i18n.t('Cannot repay 0');
        case 'ZeroBorrow':
          return i18n.t('Cannot borrow 0');
        case 'UtilizationExceeded':
          return i18n.t('Utilization rate exceeded');

        case 'Error':
          switch (args[0]) {
            case 'TRANSFER_FROM_FAILED':
              return i18n.t('Insufficient assets or lack of approval, please try again');
            case 'ZERO_SHARES':
              return i18n.t('Cannot deposit 0');
            case 'ZERO_ASSETS':
              return i18n.t('Cannot withdraw 0');
          }
          break;

        case 'Panic':
          captureException(error);
          return defaultErr;
      }
    }
  }

  if (error.code !== ErrorCode.UNPREDICTABLE_GAS_LIMIT && error.message) {
    return error.message;
  }

  // if none of the above, report
  captureException(error);
  return defaultErr;
};
