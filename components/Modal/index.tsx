import { useContext, useState } from 'react';
import styles from './style.module.scss';

import SupplyForm from 'components/SupplyForm';
import AssetSelector from 'components/AssetSelector';
import BorrowForm from 'components/BorrowForm';
import Loading from 'components/common/Loading';

import useContractWithSigner from 'hooks/useContractWithSigner';

import AuditorContext from 'contexts/AuditorContext';

import { SupplyRate } from 'types/SupplyRate';

import dictionary from 'dictionary/en.json';

type Props = {
  contractData: any;
  closeModal: any;
};

function Modal({ contractData, closeModal }: Props) {
  const auditor = useContext(AuditorContext);

  const [potentialRate, setPotentialRate] = useState<string | undefined>('0');

  const [hasRate, setHasRate] = useState<boolean | undefined>(true);

  const { contractWithSigner } = useContractWithSigner(
    contractData?.address,
    auditor?.abi!
  );

  function handleResult(data: SupplyRate | undefined) {
    setHasRate(data?.hasRate);
    setPotentialRate(data?.potentialRate);
  }

  function handleClose() {
    closeModal({});
  }

  return (
    <div className={styles.modal}>
      <div className={styles.closeContainer}>
        <span className={styles.closeButton} onClick={handleClose}>
          X
        </span>
      </div>
      <div className={styles.assets}>
        <p>{contractData.type == 'borrow' ? 'Borrow' : 'Deposit'}</p>
        <AssetSelector defaultAddress={contractData.address} />
      </div>
      {contractWithSigner && contractData.type == 'deposit' && (
        <SupplyForm
          contractWithSigner={contractWithSigner!}
          handleResult={handleResult}
          hasRate={hasRate}
          address={contractData.address}
        />
      )}

      {contractWithSigner && contractData.type == 'borrow' && (
        <BorrowForm
          contractWithSigner={contractWithSigner!}
          handleResult={handleResult}
          hasRate={hasRate}
          address={contractData.address}
        />
      )}

      {!contractWithSigner && <Loading />}

      {potentialRate && (
        <section className={styles.right}>
          <p>
            <span className={styles.detail}> {dictionary.annualRate}</span>
            <span className={styles.value}>
              {(parseFloat(potentialRate) * 100).toFixed(4)} %
            </span>
          </p>
        </section>
      )}

      {!hasRate && <Loading />}
    </div>
  );
}

export default Modal;
