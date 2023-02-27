import type { RewardsController } from 'types/contracts/RewardsController';
import rewardsControllerABI from 'abi/RewardsController.json' assert { type: 'json' };
import useContract from './useContract';

export default () => {
  return useContract<RewardsController>('RewardsController', rewardsControllerABI);
};
