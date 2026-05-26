import { interestRateModelAbi, auditorAbi, marketAbi } from 'generated/wagmi';

export default [
  ...marketAbi.filter(({ type }) => type === 'error'),
  ...auditorAbi.filter(({ type }) => type === 'error'),
  ...interestRateModelAbi.filter(({ type }) => type === 'error'),
  {
    type: 'error',
    name: 'Panic',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256', indexed: false }],
  },
  {
    type: 'error',
    name: 'Error',
    inputs: [{ name: '', internalType: 'string', type: 'string', indexed: false }],
  },
] as const;
