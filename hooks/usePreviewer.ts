import { useContext, useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerABI from 'abi/Previewer.json';
import { Previewer } from 'types/contracts/Previewer';
import PreviewerContext from 'contexts/PreviewerContext';
import { InfuraProvider } from '@ethersproject/providers';

export default () => {
  const { network } = useWeb3Context();
  const { address } = useContext(PreviewerContext);

  const previewerContract = useMemo(() => {
    if (!address) return;

    const publicNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;
    const provider = new InfuraProvider(publicNetwork);

    return new Contract(address, PreviewerABI, provider) as Previewer;
  }, [address, network]);

  return previewerContract;
};
