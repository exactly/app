import React, { useContext } from 'react';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import LangContext from 'contexts/LangContext';

import { Dictionary } from 'types/Dictionary';
import { LangKeys } from 'types/Lang';

import { getSymbol } from 'utils/utils';

import styles from './style.module.scss';

import keys from './translations.json';

function AddETokensButton() {
  const { web3Provider, network } = useWeb3Context();
  const fixedLenders = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const decimals: Dictionary<number> = {
    USDC: 6,
    WBTC: 8,
    DAI: 18,
    WETH: 18,
    ETH: 18,
  };

  async function addTokens() {
    if (!network || !fixedLenders.length) return;

    try {
      fixedLenders?.forEach(async (contract) => {
        if (!web3Provider?.provider.request) return;
        const symbol = getSymbol(contract.address!, network.name);

        return await web3Provider?.provider?.request({
          method: 'wallet_watchAsset',
          params: {
            // @ts-expect-error bad typing
            type: 'ERC20',
            options: {
              address: contract?.address,
              symbol: `e${symbol}`,
              decimals: decimals[symbol],
              image: '',
            },
          },
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <p className={styles.addAssets} onClick={addTokens}>
      {translations[lang].addTokens}
    </p>
  );
}

export default AddETokensButton;
