import { captureException as sentryCaptureException } from '@sentry/nextjs';
import i18n from 'i18n';
import errorABI from 'utils/ErrorInterface';
import {
  isHex,
  decodeErrorResult,
  AbiErrorSignatureNotFoundError,
  BaseError,
  CallExecutionError,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  TransactionExecutionError,
} from 'viem';

function parse(name?: string): string {
  const defaultErr = i18n.t('There was an error, please try again');
  if (!name) {
    return defaultErr;
  }
  switch (name) {
    case 'InsufficientAccountLiquidity':
      return i18n.t('There is not enough liquidity in your account');
    case 'InsufficientProtocolLiquidity':
      return i18n.t('There is not enough liquidity in the protocol');
    case 'AllowanceSurplus':
      return i18n.t('Token allowance surplus after operation');
    case 'Disagreement':
      return i18n.t('Not enough slippage');
    case 'InvalidPrice':
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
    default:
      return defaultErr;
  }
}

export default (error: unknown, captureException: typeof sentryCaptureException = sentryCaptureException): string => {
  const defaultErr = i18n.t('There was an error, please try again');

  if (error instanceof BaseError) {
    if (error instanceof TransactionExecutionError) {
      return error.shortMessage;
    }

    if (error instanceof ContractFunctionExecutionError) {
      const revert = error.walk((e) => e instanceof ContractFunctionRevertedError) as
        | ContractFunctionRevertedError
        | undefined;
      if (revert && revert.name === 'ContractFunctionRevertedError') {
        return parse(revert.data?.errorName);
      }

      const call = error.walk((e) => e instanceof CallExecutionError) as CallExecutionError | undefined;
      if (call && call.name === 'CallExecutionError') {
        return defaultErr;
      }
    }

    if (error instanceof AbiErrorSignatureNotFoundError) {
      try {
        const data = error.shortMessage.match(/"0x.*"/)?.[0]?.replaceAll('"', '');
        if (!isHex(data)) {
          return defaultErr;
        }
        const decoded = decodeErrorResult({ abi: errorABI, data });
        return parse(decoded.errorName);
      } catch {
        //ignore
      }
    }
  }

  captureException(error);
  return defaultErr;
};
