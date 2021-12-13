import { useContext, useEffect, useState } from 'react';
import styles from './style.module.scss';

import SupplyForm from 'components/SupplyForm';
import AssetSelector from 'components/AssetSelector';

import useContractWithSigner from 'hooks/useContractWithSigner';

import ContractContext from 'contexts/ContractContext';

import { Market } from 'types/Market';
import { SupplyRate } from 'types/SupplyRate';

import dictionary from 'dictionary/en.json';
import BorrowForm from 'components/BorrowForm';

type Props = {
  contractData: any;
  closeModal: any;
};

function Modal({ contractData, closeModal }: Props) {
  const contracts = useContext(ContractContext);

  const [potentialRate, setPotentialRate] = useState<string | undefined>(
    undefined
  );
  const [poolSupply, setPoolSupply] = useState<string | undefined>(undefined);
  const [poolLend, setPoolLend] = useState<string | undefined>(undefined);

  const [auditorData, setAuditorData] = useState<Market | undefined | any>(
    contractData
  );

  const [hasRate, setHasRate] = useState<boolean>(false);

  const { contractWithSigner } = useContractWithSigner(
    contractData?.address,
    contracts?.auditor?.abi
  );

  useEffect(() => {}, [hasRate, potentialRate]);

  function handleResult(data: SupplyRate | undefined) {
    setHasRate(data?.potentialRate ? true : false);
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
        <p>{contractData.type == 'desposit' ? 'Borrow' : 'Deposit'}</p>
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

      {hasRate && (
        <section className={styles.right}>
          <p>
            {dictionary.annualRate}: <strong>{potentialRate}</strong>
          </p>
        </section>
      )}
    </div>
  );
}

export default Modal;
