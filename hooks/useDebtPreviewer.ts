import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';

import { debtPreviewerAbi } from 'generated/wagmi';

export type Leverage = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof debtPreviewerAbi, 'leverage'>['outputs']
>[number];

export type Limit = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof debtPreviewerAbi, 'previewLeverage'>['outputs']
>[number];

export type Rates = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof debtPreviewerAbi, 'leverageRates'>['outputs']
>[number];
