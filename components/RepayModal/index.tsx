import { ChangeEvent, useState } from 'react';
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

import parseTimestamp from 'utils/parseTimestamp';

import styles from './style.module.scss';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
  walletAddress: string;
};

function RepayModal({ data, closeModal, walletAddress }: Props) {
  const { address, symbol, maturityDate, amount } = data;

  const [qty, setQty] = useState<string>('0');

  const parsedAmount = ethers.utils.formatUnits(amount, 18);
  const isLateRepay = Date.now() / 1000 > parseInt(maturityDate);

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
        <ModalTitle title={isLateRepay ? 'Late Repay' : 'Early Repay'} />
        <ModalAsset asset={symbol} amount={parsedAmount} />
        <ModalClose closeModal={closeModal} />
        <ModalRow text="Maturity Pool" value={parseTimestamp(maturityDate)} />
        <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} />
        <ModalRow text="Remaining Debt" value={parsedAmount} line />
        <ModalRow text="Debt Slippage" value="X %" line />
        <ModalRow text="Health Factor" values={['1.1', '1.8']} />
        <div className={styles.buttonContainer}>
          <Button
            text="Repay"
            className={qty <= '0' || !qty ? 'secondaryDisabled' : 'quaternary'}
          />
        </div>
      </section>
      <Overlay closeModal={closeModal} />
    </>
  );
}

export default RepayModal;
