import React, { useCallback, useContext, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { parseFixed } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import Image from 'next/image';

import Button from 'components/common/Button';

import faucetAbi from './abi.json';

import AccountDataContext from 'contexts/AccountDataContext';
import useAssets from 'hooks/useAssets';

import styles from './style.module.scss';

const images: Record<string, string> = {
  DAI: 'https://gateway.ipfs.io/ipfs/QmXyHPX8GS99dUiChsq7iRfZ4y3aofQqPjMjFJyCpkWs8e',
  WBTC: 'https://gateway.ipfs.io/ipfs/QmZHbqjFzzbf5sR2LJtVPi5UeEqS7fmzLBiWFRAM1dsJRm',
  USDC: 'https://gateway.ipfs.io/ipfs/QmSi4utTywi5EANuedkPT2gi5qj6g3aeXzPjMWkeYdk7Ag',
};

function Faucet() {
  const { data: signer } = useSigner();
  const { connector } = useAccount();
  const { accountData } = useContext(AccountDataContext);
  const [loading, setLoading] = useState<string | undefined>(undefined);
  const assets = useAssets();

  const mint = useCallback(
    async (symbol: string) => {
      if (!accountData) return;
      try {
        const { asset, decimals } = accountData[symbol];

        setLoading(symbol);
        const amounts: Record<string, string> = {
          DAI: '50000',
          USDC: '50000',
          WBTC: '2',
        };

        const faucet = new Contract('0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe', faucetAbi, signer ?? undefined);
        const tx = await faucet?.mint(asset, parseFixed(amounts[symbol], decimals));
        await tx.wait();
      } catch {
        setLoading(undefined);
      } finally {
        setLoading(undefined);
      }
    },
    [accountData, signer],
  );

  const addTokens = useCallback(async () => {
    if (!accountData) return;

    try {
      await Promise.all(
        Object.values(accountData)
          .filter(({ assetSymbol }) => assetSymbol !== 'WETH')
          .map(({ asset: address, decimals, assetSymbol: symbol }) =>
            connector?.watchAsset?.({ symbol, address, decimals, image: images[symbol] }),
          ),
      );
    } catch (error: any) {
      if (error.code !== 4001) throw error;
    }
  }, [accountData, connector]);

  return (
    <>
      <div className={styles.faucetContainer}>
        <div className={styles.titlesContainer}>
          <h4 className={styles.addTokens} onClick={addTokens}>
            Add tokens to Metamask
          </h4>
        </div>
        <div className={styles.header}>
          <p>Asset</p>
        </div>
        {assets.map((asset) => {
          if (asset === 'WETH') {
            return (
              <div className={styles.assetContainer} key={asset}>
                <p className={styles.asset}>
                  <Image
                    src={`/img/assets/weth.svg`}
                    alt={asset}
                    width={40}
                    height={40}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                  ETH
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
                  <Image
                    src={`/img/assets/${asset}.svg`}
                    alt={asset}
                    width={40}
                    height={40}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
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
                <Image
                  src={`/img/assets/${asset}.svg`}
                  alt={asset}
                  width={40}
                  height={40}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
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
