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

type Props = {
  contractData: any;
  closeModal: any;
  walletAddress: string;
};

function Modal({ contractData, closeModal, walletAddress }: Props) {
  const auditor = useContext(AuditorContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;


  console.log(auditor)
  const [potentialRate, setPotentialRate] = useState<string | undefined>('0');

  const [assetData, setAssetData] = useState<Market | undefined>(undefined);

  const [hasRate, setHasRate] = useState<boolean | undefined>(true);

  const [tx, setTx] = useState<Transaction | undefined>(undefined);

  const [minimized, setMinimized] = useState<Boolean>(false);

  const { contractWithSigner } = useContractWithSigner(
    contractData?.address,
    auditor?.abi!
  );

  console.log(contractWithSigner)
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
          <div className={styles.closeContainer}>
            <span
              className={styles.closeButton}
              onClick={
                !tx || tx.status == 'success'
                  ? handleClose
                  : () => {
                    setMinimized((prev) => !prev);
                  }
              }
            >
              X
            </span>
          </div>
          {!tx && (
            <>
              <div className={styles.assets}>
                <p>
                  {contractData.type == 'borrow'
                    ? translations[lang].borrow
                    : translations[lang].deposit}
                </p>
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
                    handleTx={(data: Transaction) => setTx(data)}
                    walletAddress={walletAddress}
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
                    handleTx={(data: Transaction) => setTx(data)}
                  />
                )}

              {!contractWithSigner && <Loading />}

              {potentialRate && (
                <section className={styles.right}>
                  <p>
                    <span className={styles.detail}>
                      {translations[lang].annualRate}
                    </span>
                    <span className={styles.value}>
                      {(parseFloat(potentialRate) * 100).toFixed(
                        numbers.decimals
                      )}{' '}
                      %
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
