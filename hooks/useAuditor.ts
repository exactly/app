import { useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useSigner } from 'wagmi';
import { mainnet, goerli, optimismGoerli } from 'wagmi/chains';
import type { Auditor } from 'types/contracts/Auditor';
import mainnetAuditor from '@exactly-protocol/protocol/deployments/mainnet/Auditor.json' assert { type: 'json' };
import goerliAuditor from '@exactly-protocol/protocol/deployments/goerli/Auditor.json' assert { type: 'json' };
import optimismGoerliAuditor from '@exactly-protocol/protocol/deployments/optimism-goerli/Auditor.json' assert { type: 'json' };
import auditorABI from 'abi/Auditor.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';

export default () => {
  const { data: signer } = useSigner();
  const { chain } = useWeb3();

  return useMemo(() => {
    if (!signer || !chain) return null;

    const address = {
      [goerli.id]: goerliAuditor.address,
      [mainnet.id]: mainnetAuditor.address,
      [optimismGoerli.id]: optimismGoerliAuditor.address,
    }[chain.id];
    if (!address) return null;

    return new Contract(address, auditorABI, signer) as Auditor;
  }, [chain, signer]);
};
