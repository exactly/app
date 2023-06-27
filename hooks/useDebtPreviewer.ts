import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';

import { debtPreviewerABI } from 'types/abi';
import useContract from './useContract';

export type Leverage = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof debtPreviewerABI, 'leverage'>['outputs']
>[number];

export default () => {
  return useContract('DebtPreviewer', debtPreviewerABI);
};
