import { useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import type { Auditor } from 'types/contracts/Auditor';
import mainnetAuditor from '@exactly-protocol/protocol/deployments/mainnet/Auditor.json' assert { type: 'json' };
import goerliAuditor from '@exactly-protocol/protocol/deployments/goerli/Auditor.json' assert { type: 'json' };
import auditorABI from 'abi/Auditor.json' assert { type: 'json' };

export default () => {
  const { web3Provider, network } = useWeb3Context();

  return useMemo(() => {
    if (!web3Provider) return null;
    return new Contract(
      {
        goerli: goerliAuditor.address,
        mainnet: mainnetAuditor.address,
      }[network?.name ?? 'mainnet'] ?? mainnetAuditor.address,
      auditorABI,
      web3Provider,
    ) as Auditor;
  }, [network?.name, web3Provider]);
};
