import { auditorABI } from 'types/abi';
import useContract from './useContract';

export default () => {
  return useContract('Auditor', auditorABI);
};
