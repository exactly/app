import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalClose from 'components/common/modal/ModalClose';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalTitle from 'components/common/modal/ModalTitle';
import Overlay from 'components/Overlay';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';

import parseTimestamp from 'utils/parseTimestamp';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
  walletAddress: string;
};

function RepayModal({ data, closeModal, walletAddress }: Props) {
  const { address, symbol, maturityDate, amount } = data;

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('0');
  const [isLateRepay, setIsLateRepay] = useState<boolean>(false);
  const parsedAmount = ethers.utils.formatUnits(amount, 18);

  useEffect(() => {
    const repay = Date.now() / 1000 > parseInt(maturityDate);

    setIsLateRepay(repay);
  }, [maturityDate]);

  function onMax() {
    setQty(parsedAmount);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);
  }

  function repay() {}

  return (
    <>
      <section className={styles.formContainer}>
        <ModalTitle
          title={isLateRepay ? translations[lang].lateRepay : translations[lang].earlyRepay}
        />
        <ModalAsset asset={symbol} amount={parsedAmount} />
        <ModalClose closeModal={closeModal} />
        <ModalRow text={translations[lang].maturityPool} value={parseTimestamp(maturityDate)} />
        <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} />
        <ModalRow text={translations[lang].remainingDebt} value={parsedAmount} line />
        <ModalRow text={translations[lang].debtSlippage} value="X %" line />
        <ModalRow text={translations[lang].healthFactor} values={['1.1', '1.8']} />
        <div className={styles.buttonContainer}>
          <Button
            text={translations[lang].repay}
            className={qty <= '0' || !qty ? 'secondaryDisabled' : 'quaternary'}
          />
        </div>
      </section>
      <Overlay closeModal={closeModal} />
    </>
  );
}

export default RepayModal;
