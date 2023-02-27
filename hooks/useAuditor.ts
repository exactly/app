import type { Auditor } from 'types/contracts/Auditor';
import auditorABI from 'abi/Auditor.json' assert { type: 'json' };
import useContract from './useContract';

export default () => {
  return useContract<Auditor>('Auditor', auditorABI);
};
