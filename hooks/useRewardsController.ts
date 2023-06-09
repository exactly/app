import { rewardsControllerABI } from 'types/abi';
import useContract from './useContract';

export default () => {
  return useContract('RewardsController', rewardsControllerABI);
};
