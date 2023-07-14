import { swapperABI } from 'types/abi';
import useContract from './useContract';

export const useSwapper = () => {
  return useContract('Swapper', swapperABI);
};
