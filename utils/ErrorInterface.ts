import { interestRateModelABI, auditorABI, marketABI } from 'types/abi';

export default [
  ...marketABI.filter(({ type }) => type === 'error'),
  ...auditorABI.filter(({ type }) => type === 'error'),
  ...interestRateModelABI.filter(({ type }) => type === 'error'),
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
