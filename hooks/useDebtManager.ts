import { debtManagerABI } from 'types/abi';
import useContract from './useContract';

export default () => {
  return useContract('DebtManager', debtManagerABI);
};
