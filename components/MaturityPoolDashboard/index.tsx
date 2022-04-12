import { useContext, useState } from 'react';

import { Option } from 'react-dropdown';
import { LangKeys } from 'types/Lang';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';
import Tabs from 'components/Tabs';
import MaturityPoolUserStatusByAsset from 'components/MaturityPoolUserStatusByAsset';
import MaturityPoolUserStatusByMaturity from 'components/MaturityPoolUserStatusByMaturity';
import DashboardHeader from 'components/DashboardHeader';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';
import Button from 'components/common/Button';

interface Props {
  deposits: Deposit[];
  borrows: Borrow[];
  showModal: (data: Deposit, type: String) => void;
}

function MaturityPoolDashboard({ deposits, borrows, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const filterByAsset = {
    label: translations[lang].filterAsset,
    value: 'asset'
  };

  const filterByMaturity = {
    label: translations[lang].filterMaturity,
    value: 'maturity'
  };

  const tabDeposit = {
    label: translations[lang].deposit,
    value: 'deposit'
  };

  const tabBorrow = {
    label: translations[lang].borrow,
    value: 'borrow'
  };

  const [filter, setFilter] = useState<Option>(filterByAsset);

  const [tab, setTab] = useState<Option>(tabDeposit);

  return (
    <section className={styles.container}>
      <DashboardHeader />
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].maturityPools}</p>
        <Tooltip value={translations[lang].maturityPools} />
      </div>
      <div className={styles.optionsContainer}>
        <Tabs
          values={[tabDeposit, tabBorrow]}
          selected={tab}
          handleTab={(value: Option) => {
            setTab(value);
          }}
        />
        <div className={styles.line} />
      </div>
      <section className={styles.sectionContainer}>
        <div className={styles.selectContainer}>
          <Select
            onChange={(option: Option) => {
              setFilter(option);
            }}
            options={[filterByAsset, filterByMaturity]}
            value={filter}
          />
        </div>

        <div className={styles.buttonContainer}>
          <Button
            text={
              tab.value == 'borrow' ? translations[lang].newBorrow : translations[lang].newDeposit
            }
            className={tab.value == 'borrow' ? 'secondary' : 'primary'}
            onClick={() => showModal(tab.value == 'borrow' ? borrows[0] : deposits[0], tab.value)}
          />
        </div>
      </section>

      {filter?.value == 'asset' ? (
        <MaturityPoolUserStatusByAsset
          type={tab}
          deposits={deposits}
          borrows={borrows}
          showModal={showModal}
        />
      ) : (
        <MaturityPoolUserStatusByMaturity
          type={tab}
          deposits={deposits}
          borrows={borrows}
          showModal={showModal}
        />
      )}
    </section>
  );
}

export default MaturityPoolDashboard;
