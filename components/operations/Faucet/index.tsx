import { useContext, useState } from 'react';
import { utils } from 'ethers';
import Image from 'next/image';

import Button from 'components/common/Button';

import faucetAbi from './faucetAbi.json';

import { getUnderlyingData } from 'utils/utils';

import { useWeb3Context } from 'contexts/Web3Context';
import LangContext from 'contexts/LangContext';
import ContractsContext from 'contexts/ContractsContext';

import { Dictionary } from 'types/Dictionary';
import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

function Faucet() {
  const { network, web3Provider } = useWeb3Context();
  const { getInstance } = useContext(ContractsContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [loading, setLoading] = useState<string | undefined>(undefined);

  const decimals: Dictionary<number> = {
    USDC: 6,
    WBTC: 8,
    DAI: 18,
    WETH: 18,
    ETH: 18,
  };

  async function mint(asset: string) {
    try {
      const contract = getUnderlyingData(network!.name.toLowerCase(), asset.toLowerCase());

      setLoading(asset);
      const amounts: Dictionary<string> = {
        DAI: '50000',
        USDC: '50000',
        WBTC: '2',
      };

      const faucetContract = getInstance(
        '0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe', // TODO: move to config file
        faucetAbi,
        'faucet',
      );

      const mint = await faucetContract?.mint(
        contract?.address,
        utils.parseUnits(amounts[asset.toUpperCase()], decimals[asset.toUpperCase()]),
      );

      await mint.wait();

      setLoading(undefined);
    } catch (e) {
      setLoading(undefined);
    }
  }

  const assets = ['DAI', 'USDC', 'ETH', 'WBTC', 'WSTETH'];

  async function addTokens() {
    const filter = assets.filter((asset) => asset != 'ETH');

    const images: Dictionary<string> = {
      DAI: 'https://gateway.ipfs.io/ipfs/QmXyHPX8GS99dUiChsq7iRfZ4y3aofQqPjMjFJyCpkWs8e',
      WBTC: 'https://gateway.ipfs.io/ipfs/QmZHbqjFzzbf5sR2LJtVPi5UeEqS7fmzLBiWFRAM1dsJRm',
      USDC: 'https://gateway.ipfs.io/ipfs/QmSi4utTywi5EANuedkPT2gi5qj6g3aeXzPjMWkeYdk7Ag',
    };

    try {
      filter.forEach(async (asset) => {
        if (!web3Provider?.provider.request) return;

        const contract = getUnderlyingData(network!.name.toLowerCase(), asset.toLowerCase());

        const upperCaseAsset = asset.toUpperCase();

        return await web3Provider?.provider?.request({
          method: 'wallet_watchAsset',
          params: {
            // @ts-expect-error bad typing
            type: 'ERC20',
            options: {
              address: contract?.address,
              symbol: upperCaseAsset,
              decimals: decimals[upperCaseAsset],
              image: images[upperCaseAsset],
            },
          },
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <div className={styles.faucetContainer}>
        <div className={styles.titlesContainer}>
          <h3 className={styles.title}>{translations[lang].faucet}</h3>
          <h4 className={styles.addTokens} onClick={addTokens}>
            {translations[lang].addTokens}
          </h4>
        </div>
        <div className={styles.header}>
          <p>{translations[lang].asset}</p>
          <p></p>
        </div>
        {assets.map((asset) => {
          if (asset == 'ETH') {
            return (
              <div className={styles.assetContainer} key={asset}>
                <p className={styles.asset}>
                  <Image src={`/img/assets/weth.svg`} alt={asset} width={40} height={40} />
                  {asset}
                </p>
                <div className={styles.buttonContainer}>
                  <a href="https://goerlifaucet.com/" target="_blank" rel="noopener noreferrer">
                    <Button text={translations[lang].mint} />
                  </a>
                </div>
              </div>
            );
          }
          if (asset == 'WSTETH') {
            return (
              <div className={styles.assetContainer} key={asset}>
                <p className={styles.asset}>
                  <Image src={`/img/assets/wsteth.svg`} alt={asset} width={40} height={40} />
                  {asset}
                </p>
                <div className={styles.buttonContainer}>
                  <a href="https://stake.testnet.fi/" target="_blank" rel="noopener noreferrer">
                    <Button text={translations[lang].mint} />
                  </a>
                </div>
              </div>
            );
          }
          return (
            <div className={styles.assetContainer} key={asset}>
              <p className={styles.asset}>
                <Image src={`/img/assets/${asset.toLowerCase()}.svg`} alt={asset} width={40} height={40} />
                {asset}
              </p>
              <div className={styles.buttonContainer}>
                <Button text={translations[lang].mint} onClick={() => mint(asset)} loading={asset == loading} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Faucet;
