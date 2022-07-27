import { useContext, useState } from 'react';
import { ethers } from 'ethers';

import ModalWrapper from 'components/common/modal/ModalWrapper';
import Overlay from 'components/Overlay';
import Button from 'components/common/Button';

import faucetAbi from './faucetAbi.json';

import { getContractData } from 'utils/contracts';
import { getUnderlyingData } from 'utils/utils';

import { useWeb3Context } from 'contexts/Web3Context';
import LangContext from 'contexts/LangContext';

import { Dictionary } from 'types/Dictionary';
import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  closeModal: (props: any) => void;
};

function FaucetModal({ closeModal }: Props) {
  const { network, web3Provider } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [loading, setLoading] = useState<string | undefined>(undefined);

  const faucetContract = getContractData(
    network?.name!,
    '0x88138ca1e9e485a1e688b030f85bb79d63f156ba',
    faucetAbi,
    web3Provider?.getSigner()
  );

  async function mint(asset: string) {
    const decimals: Dictionary<number> = {
      USDC: 6,
      WBTC: 8,
      DAI: 18,
      WETH: 18,
      ETH: 18
    };
    try {
      const contract = getUnderlyingData(network!.name.toLowerCase(), asset.toLowerCase());

      setLoading(asset);

      const mint = await faucetContract?.mint(
        contract?.address,
        ethers.utils.parseUnits('10000', decimals[asset.toUpperCase()])
      );

      await mint.wait();

      setLoading(undefined);
    } catch (e) {
      setLoading(undefined);
    }
  }

  const assets = ['DAI', 'USDC', 'ETH', 'WBTC'];

  return (
    <>
      <ModalWrapper closeModal={closeModal}>
        <div className={styles.faucetContainer}>
          <h3 className={styles.title}>{translations[lang].faucet}</h3>
          <div className={styles.header}>
            <p>{translations[lang].asset}</p>
            <p></p>
          </div>
          {assets.map((asset) => {
            if (asset == 'ETH') {
              return (
                <div className={styles.assetContainer}>
                  <p className={styles.asset}>
                    <img src={`/img/assets/weth.png`} alt={asset} className={styles.assetImage} />
                    {asset}
                  </p>
                  <div className={styles.buttonContainer}>
                    <a href="https://rinkebyfaucet.com/" target="_blank" rel="noopener noreferrer">
                      <Button text={translations[lang].mint} />
                    </a>
                  </div>
                </div>
              );
            }
            return (
              <div className={styles.assetContainer} key={asset}>
                <p className={styles.asset}>
                  <img
                    src={`/img/assets/${asset.toLowerCase()}.png`}
                    alt={asset}
                    className={styles.assetImage}
                  />
                  {asset}
                </p>
                <div className={styles.buttonContainer}>
                  <Button
                    text={translations[lang].mint}
                    onClick={() => mint(asset)}
                    loading={asset == loading}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ModalWrapper>
      <Overlay closeModal={closeModal} />
    </>
  );
}

export default FaucetModal;
