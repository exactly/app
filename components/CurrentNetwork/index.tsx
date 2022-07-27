import { useContext } from 'react';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import Button from 'components/common/Button';

import allowedNetworks from 'config/allowedNetworks.json';

type Props = {
  showModal?: (marketData: any, type: any) => void;
};

function CurrentNetwork({ showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { network, web3Provider } = useWeb3Context();
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
    } else if (isAllowed && network?.name == 'rinkeby' && showModal) {
      showModal({}, 'faucet');
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
              <span>{translations[lang].connectedTo}</span>{' '}
              <strong>{network?.name ?? 'unknown'}</strong>{' '}
              {network?.name == 'rinkeby' && <span>{translations[lang].faucet}</span>}
            </p>
          </>
        )}
        {!network && <p>{translations[lang].disconnected}</p>}
        {!isAllowed && network && (
          <p>
            Click here to connect to <strong>{process.env.NEXT_PUBLIC_NETWORK}</strong> and start
            using <strong>Exactly</strong> Protocol{' '}
          </p>
        )}
      </div>
    </div>
  );
}

export default CurrentNetwork;
