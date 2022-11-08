import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerABI from 'abi/Previewer.json';
import { Previewer } from 'types/contracts/Previewer';
import { useContext } from 'react';
import PreviewerContext from 'contexts/PreviewerContext';

export default () => {
  const { web3Provider } = useWeb3Context();
  const { address } = useContext(PreviewerContext);

  return address ? (new Contract(address, PreviewerABI, web3Provider?.getSigner()) as Previewer) : undefined;
};
