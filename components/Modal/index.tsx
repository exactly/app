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

import { SupplyRate } from 'types/SupplyRate';
import { Market } from 'types/Market';
import { Transaction } from 'types/Transaction';

import dictionary from 'dictionary/en.json';

type Props = {
  contractData: any;
  closeModal: any;
};

function Modal({ contractData, closeModal }: Props) {
  const auditor = useContext(AuditorContext);

  const [potentialRate, setPotentialRate] = useState<string | undefined>('0');

  const [assetData, setAssetData] = useState<Market | undefined>(undefined);

  const [hasRate, setHasRate] = useState<boolean | undefined>(true);

  const [tx, setTx] = useState<Transaction | undefined>(undefined);

  const [minimized, setMinimized] = useState<Boolean>(false);

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

  function handleMinimize() {
    setMinimized((prev) => !prev);
  }

  function handleTx(data: Transaction) {
    setTx(data);
  }

  return (
    <>
      {!minimized && (
        <div className={styles.modal}>
          <div className={styles.closeContainer}>
            <span
              className={styles.closeButton}
              onClick={
                !tx || tx.status == 'success' ? handleClose : handleMinimize
              }
            >
              X
            </span>
          </div>
          {!tx && (
            <>
              <div className={styles.assets}>
                <p>{contractData.type == 'borrow' ? 'Borrow' : 'Deposit'}</p>
                <AssetSelector
                  defaultAddress={contractData.address}
                  onChange={(marketData) => setAssetData(marketData)}
                />
              </div>
              {contractWithSigner &&
                contractData.type == 'deposit' &&
                assetData && (
                  <SupplyForm
                    contractWithSigner={contractWithSigner!}
                    handleResult={handleResult}
                    hasRate={hasRate}
                    address={contractData.address}
                    assetData={assetData}
                    handleTx={handleTx}
                  />
                )}

              {contractWithSigner &&
                contractData.type == 'borrow' &&
                assetData && (
                  <BorrowForm
                    contractWithSigner={contractWithSigner!}
                    handleResult={handleResult}
                    hasRate={hasRate}
                    address={contractData.address}
                    assetData={assetData}
                    handleTx={handleTx}
                  />
                )}

              {!contractWithSigner && <Loading />}

              {potentialRate && (
                <section className={styles.right}>
                  <p>
                    <span className={styles.detail}>
                      {' '}
                      {dictionary.annualRate}
                    </span>
                    <span className={styles.value}>
                      {(parseFloat(potentialRate) * 100).toFixed(4)} %
                    </span>
                  </p>
                </section>
              )}

              {!hasRate && <Loading />}
            </>
          )}
          {tx && <ModalGif tx={tx} />}
        </div>
      )}

      {tx && minimized && (
        <MinimizedModal tx={tx} handleMinimize={handleMinimize} />
      )}

      {!minimized && (
        <Overlay
          closeModal={
            !tx || tx.status == 'success' ? handleClose : handleMinimize
          }
        />
      )}
    </>
  );
}

export default Modal;
