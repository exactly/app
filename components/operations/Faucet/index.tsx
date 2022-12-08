import React, { useContext, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import Image from 'next/image';

import Button from 'components/common/Button';

import faucetAbi from './abi.json';

import { getUnderlyingData } from 'utils/utils';

import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

function Faucet() {
  const { network, web3Provider } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const [loading, setLoading] = useState<string | undefined>(undefined);

  async function mint(symbol: string) {
    if (!accountData) return;
    try {
      const contract = getUnderlyingData(network!.name.toLowerCase(), symbol);

      setLoading(symbol);
      const amounts: Record<string, string> = {
        DAI: '50000',
        USDC: '50000',
        WBTC: '2',
      };

      const faucet = new Contract('0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe', faucetAbi, web3Provider?.getSigner()); // HACK de-hardcode
      const tx = await faucet?.mint(contract?.address, parseFixed(amounts[symbol], accountData[symbol].decimals));
      await tx.wait();
      setLoading(undefined);
    } catch (e) {
      setLoading(undefined);
    }
  }

  const assets = ['DAI', 'USDC', 'ETH', 'WBTC', 'wstETH'];

  async function addTokens() {
    if (!accountData) return;

    const images: Record<string, string> = {
      DAI: 'https://gateway.ipfs.io/ipfs/QmXyHPX8GS99dUiChsq7iRfZ4y3aofQqPjMjFJyCpkWs8e',
      WBTC: 'https://gateway.ipfs.io/ipfs/QmZHbqjFzzbf5sR2LJtVPi5UeEqS7fmzLBiWFRAM1dsJRm',
      USDC: 'https://gateway.ipfs.io/ipfs/QmSi4utTywi5EANuedkPT2gi5qj6g3aeXzPjMWkeYdk7Ag',
    };

    try {
      await Promise.all(
        Object.values(accountData)
          .filter(({ assetSymbol }) => assetSymbol !== 'WETH')
          .map(({ asset: address, decimals, assetSymbol: symbol }) => {
            return web3Provider?.provider.request?.({
              method: 'wallet_watchAsset',
              params: {
                // @ts-expect-error bad typing
                type: 'ERC20',
                options: { symbol, address, decimals, image: images[symbol] },
              },
            });
          }),
      );
    } catch (error: any) {
      if (error.code !== 4001) throw error;
    }
  }

  return (
    <>
      <div className={styles.faucetContainer}>
        <div className={styles.titlesContainer}>
          <h3 className={styles.title}>Faucet</h3>
          <h4 className={styles.addTokens} onClick={addTokens}>
            Add tokens to Metamask
          </h4>
        </div>
        <div className={styles.header}>
          <p>Asset</p>
          <p></p>
        </div>
        {assets.map((asset) => {
          if (asset === 'ETH') {
            return (
              <div className={styles.assetContainer} key={asset}>
                <p className={styles.asset}>
                  <Image src={`/img/assets/weth.svg`} alt={asset} width={40} height={40} />
                  {asset}
                </p>
                <div className={styles.buttonContainer}>
                  <a href="https://goerlifaucet.com/" target="_blank" rel="noopener noreferrer">
                    <Button text="Mint" />
                  </a>
                </div>
              </div>
            );
          }
          if (asset === 'wstETH') {
            return (
              <div className={styles.assetContainer} key={asset}>
                <p className={styles.asset}>
                  <Image src={`/img/assets/${asset}.svg`} alt={asset} width={40} height={40} />
                  {asset}
                </p>
                <div className={styles.buttonContainer}>
                  <a href="https://stake.testnet.fi/" target="_blank" rel="noopener noreferrer">
                    <Button text="Mint" />
                  </a>
                </div>
              </div>
            );
          }
          return (
            <div className={styles.assetContainer} key={asset}>
              <p className={styles.asset}>
                <Image src={`/img/assets/${asset}.svg`} alt={asset} width={40} height={40} />
                {asset}
              </p>
              <div className={styles.buttonContainer}>
                <Button text="Mint" onClick={() => mint(asset)} loading={asset === loading} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Faucet;
