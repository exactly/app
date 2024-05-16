import { debtManagerABI, marketABI } from 'types/abi';
import useContract from './useContract';

const marketErrorsABI = marketABI.filter(({ type }) => type === 'error');
const abi = [...debtManagerABI, ...marketErrorsABI] as const;

export default () => {
  return useContract('DebtManager', abi);
};
