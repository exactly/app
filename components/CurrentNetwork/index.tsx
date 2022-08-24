import { useContext } from 'react';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import ModalStatusContext from 'contexts/ModalStatusContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import allowedNetworks from 'config/allowedNetworks.json';

function CurrentNetwork() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { network, web3Provider } = useWeb3Context();
  const { setOpen, setModalContent } = useContext(ModalStatusContext);

  const isAllowed = network && allowedNetworks.includes(network?.name);
  const status = network?.name && isAllowed ? 'success' : 'error';

  async function handleClick() {
    if (!isAllowed) {
      if (!web3Provider?.provider.request) return;

      await web3Provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: '0x4'
          }
        ]
      });
    } else if (isAllowed && network?.name == 'rinkeby') {
      setOpen(true);
      setModalContent({ type: 'faucet' });
    }
  }

  return (
    <div
      className={styles.network}
      onClick={handleClick}
      style={isAllowed ? {} : { cursor: 'pointer' }}
    >
      <div className={`${styles.alertContainer} ${status ? styles[status] : ''}`}>
        {isAllowed && network && (
          <>
            <p>
              <span>
                You are connected to <strong> EXACTLY TESTNET</strong> on
              </span>{' '}
              <strong>{network?.name?.toUpperCase() ?? 'UNKNOWN'}</strong>{' '}
              {network?.name == 'rinkeby' && <span>{translations[lang].faucet}</span>}
            </p>
          </>
        )}
        {!network && (
          <p>
            {translations[lang].disconnected} to use <strong>EXACTLY TESTNET</strong>
          </p>
        )}
        {!isAllowed && network && (
          <p>
            Click here to connect to <strong>{process.env.NEXT_PUBLIC_NETWORK}</strong> and start
            using <strong>EXACTLY TESTNET </strong>{' '}
          </p>
        )}
      </div>
    </div>
  );
}

export default CurrentNetwork;
