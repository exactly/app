import { useContext, useState } from 'react';
import styles from './style.module.scss';

import SupplyForm from 'components/SupplyForm';
import AssetSelector from 'components/AssetSelector';
import BorrowForm from 'components/BorrowForm';
import Loading from 'components/common/Loading';
import ModalGif from 'components/ModalGif';
import MinimizedModal from 'components/MinimizedModal';
import Overlay from 'components/Overlay';

import useContractWithSigner from 'hooks/useContractWithSigner';

import AuditorContext from 'contexts/AuditorContext';
import LangContext from 'contexts/LangContext';

import { SupplyRate } from 'types/SupplyRate';
import { Market } from 'types/Market';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import numbers from 'config/numbers.json';
import RepayModal from 'components/RepayModal';

type Props = {
  contractData: any;
  closeModal: any;
  walletAddress: string;
};

function Modal({ contractData, closeModal, walletAddress }: Props) {
  const auditor = useContext(AuditorContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [potentialRate, setPotentialRate] = useState<string | undefined>('0');

  const [assetData, setAssetData] = useState<Market | undefined>(undefined);

  const [hasRate, setHasRate] = useState<boolean | undefined>(true);

  const [tx, setTx] = useState<Transaction | undefined>(undefined);

  const [minimized, setMinimized] = useState<Boolean>(false);

  const { contractWithSigner } = useContractWithSigner(contractData?.address, auditor?.abi!);

  function handleResult(data: SupplyRate | undefined) {
    setHasRate(data?.hasRate);
    setPotentialRate(data?.potentialRate);
  }

  function handleClose() {
    closeModal({});
  }

  return (
    <>
      {!minimized && (
        <div className={styles.modal}>
          <RepayModal />
        </div>
      )}

      {tx && minimized && (
        <MinimizedModal
          tx={tx}
          handleMinimize={() => {
            setMinimized((prev) => !prev);
          }}
        />
      )}

      {!minimized && (
        <Overlay
          closeModal={
            !tx || tx.status == 'success'
              ? handleClose
              : () => {
                  setMinimized((prev) => !prev);
                }
          }
        />
      )}
    </>
  );
}

export default Modal;
