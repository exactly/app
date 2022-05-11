import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';

import { Option } from 'react-dropdown';
import { LangKeys } from 'types/Lang';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';
import MaturityPoolUserStatusByAsset from 'components/MaturityPoolUserStatusByAsset';
import MaturityPoolUserStatusByMaturity from 'components/MaturityPoolUserStatusByMaturity';
import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';

interface Props {
  deposits: Deposit[];
  borrows: Borrow[];
  showModal: (data: Deposit | Borrow, type: String) => void;
  tab: Option;
}

function MaturityPoolDashboard({ deposits, borrows, showModal, tab }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [defaultMaturity, setDefaultMaturity] = useState<string>();

  useEffect(() => {
    if (!defaultMaturity) {
      getDefaultMaturity();
    }
  }, [defaultMaturity]);

  async function getDefaultMaturity() {
    const currentTimestamp = dayjs().unix();
    const interval = 604800;
    const timestamp = currentTimestamp - (currentTimestamp % interval) + interval;

    setDefaultMaturity(timestamp.toString());
  }

  return (
    <section className={styles.container}>
      <section className={styles.sectionContainer}>
        <div className={styles.titleContainer}>
          <p className={styles.title}>{translations[lang].maturityPools}</p>
          <Tooltip value={translations[lang].maturityPools} />
        </div>
        <div className={styles.buttonContainer}>
          <Button
            text={
              tab.value == 'borrow' ? translations[lang].newBorrow : translations[lang].newDeposit
            }
            className={tab.value == 'borrow' ? 'secondary' : 'primary'}
            onClick={() =>
              showModal(
                tab.value == 'borrow'
                  ? { ...{ ...borrows[0], maturity: defaultMaturity! } }
                  : { ...{ ...deposits[0], maturity: defaultMaturity! } },
                tab.value
              )
            }
          />
        </div>
      </section>
      <MaturityPoolUserStatusByAsset
        type={tab}
        deposits={deposits}
        borrows={borrows}
        showModal={showModal}
      />
    </section>
  );
}

export default MaturityPoolDashboard;
