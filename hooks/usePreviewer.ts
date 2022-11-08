import { useContext, useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerABI from 'abi/Previewer.json';
import { Previewer } from 'types/contracts/Previewer';
import PreviewerContext from 'contexts/PreviewerContext';

export default () => {
  const { web3Provider } = useWeb3Context();
  const { address } = useContext(PreviewerContext);

  const previewerContract = useMemo(() => {
    if (!address) return;

    return new Contract(address, PreviewerABI, web3Provider?.getSigner()) as Previewer;
  }, [address, web3Provider]);

  return previewerContract;
};
