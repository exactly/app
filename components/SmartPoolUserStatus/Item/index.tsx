import { useContext, useState } from 'react';

import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';

import AuditorContext from 'contexts/AuditorContext';
import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Market } from 'types/Market';

import styles from './style.module.scss';

import keys from './translations.json';

import useContractWithSigner from 'hooks/useContractWithSigner';

type Props = {
  market?: Market;
  showModal?: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  src?: string;
};

function Item({ market, showModal, src }: Props) {
  const auditor = useContext(AuditorContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const auditorContract = useContractWithSigner(auditor.address!, auditor.abi!);

  async function handleMarket() {
    try {
      let tx;

      //we show loading
      setLoading(true);

      if (!toggle) {
        //if it's untoggled we need to ENTER
        tx = await auditorContract.contractWithSigner?.enterMarkets([
          '0xe9A7A6886f1577c280CFEbb116fF5859Aa65bdA1'
        ]);
      } else {
        //if it's toggled we need to EXIT
        tx = await auditorContract.contractWithSigner?.exitMarket(
          '0xe9A7A6886f1577c280CFEbb116fF5859Aa65bdA1'
        );
      }

      //waiting for tx to end
      await tx.wait();

      //when it ends we stop loading
      setLoading(false);
    } catch (e) {
      //if user rejects tx we change toggle status to previous, and stop loading
      setToggle((prev) => !prev);
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <img src={'/img/assets/dai.png'} className={styles.assetImage} />
        <span className={styles.primary}>DAI</span>
      </div>
      <span className={styles.value}>17,18</span>
      <span className={styles.value}>4.41%</span>
      <span className={styles.value}>21-feb-22</span>

      <span className={styles.value}>4.41%</span>

      <span className={styles.value}>
        {!loading ? (
          <Switch
            isOn={toggle}
            handleToggle={() => {
              setToggle((prev) => !prev);
              handleMarket();
            }}
            id={market?.address || Math.random().toString()}
            disabled={disabled}
          />
        ) : (
          <Loading size="small" />
        )}
      </span>

      <div className={styles.buttonContainer}>
        <Button text={translations[lang].deposit} className="primary" />
      </div>

      <div className={styles.buttonContainer}>
        <Button text={translations[lang].withdraw} className="tertiary" />
      </div>
    </div>
  );
}

export default Item;
