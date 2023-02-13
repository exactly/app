import { BigNumber } from '@ethersproject/bignumber';

export type OperationHook = {
  isLoading: boolean;
  onMax: () => void;
  handleInputChange: (value: string) => void;
  handleSubmitAction: () => void;
  needsApproval: (qty: string) => Promise<boolean>;
  previewGasCost: (qty: string) => Promise<BigNumber | undefined>;
};
