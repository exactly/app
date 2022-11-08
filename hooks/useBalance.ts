import { useWeb3Context } from 'contexts/Web3Context';
import { ERC20 } from 'types/contracts';
import { formatFixed } from '@ethersproject/bignumber';
import { useEffect, useState } from 'react';

export default (symbol?: string, assetContract?: ERC20) => {
  const { walletAddress, web3Provider } = useWeb3Context();
  const [walletBalance, setWalletBalance] = useState<string | undefined>(); // TODO: move to BigNumber

  useEffect(() => {
    const loadBalance = async () => {
      if (!walletAddress || !web3Provider) return;

      if (symbol === 'WETH') return setWalletBalance(formatFixed(await web3Provider.getBalance(walletAddress), 18));
      if (!assetContract) return;

      const decimals = await assetContract.decimals();
      setWalletBalance(formatFixed(await assetContract.balanceOf(walletAddress), decimals));
    };

    void loadBalance();
  }, [assetContract, symbol, walletAddress, web3Provider]);

  return walletBalance;
};
