import { useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useSigner } from 'wagmi';
import { optimismGoerli } from 'wagmi/chains';
import type { RewardsController } from 'types/contracts/RewardsController';
import optimismGoerliRewardsController from '@exactly-protocol/protocol/deployments/optimism-goerli/RewardsController.json' assert { type: 'json' };
import rewardsControllerABI from 'abi/RewardsController.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';

export default () => {
  const { data: signer } = useSigner();
  const { chain } = useWeb3();

  return useMemo(() => {
    if (!signer || !chain) return null;

    const address = {
      [optimismGoerli.id]: optimismGoerliRewardsController.address,
    }[chain.id];
    if (!address) return null;

    return new Contract(address, rewardsControllerABI, signer) as RewardsController;
  }, [chain, signer]);
};
