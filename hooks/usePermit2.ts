import { permit2ABI } from 'types/abi';
import useContract from './useContract';

export default () => {
  return useContract('Permit2', permit2ABI);
};
