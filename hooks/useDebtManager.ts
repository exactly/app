import type { DebtManager } from 'types/contracts/DebtManager';
import debtManagerABI from 'abi/DebtManager.json' assert { type: 'json' };
import useContract from './useContract';

export default () => {
  return useContract<DebtManager>('DebtManager', debtManagerABI);
};
