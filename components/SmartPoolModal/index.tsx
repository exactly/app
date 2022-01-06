import { useContext, useState } from 'react';
import { ethers } from 'ethers';

import styles from './style.module.scss';

import AssetSelector from 'components/AssetSelector';
import Input from 'components/common/Input';
import Button from 'components/common/Button';
import Stepper from 'components/Stepper';
import ModalGif from 'components/ModalGif';
import MinimizedModal from 'components/MinimizedModal';
import Overlay from 'components/Overlay';

import useContractWithSigner from 'hooks/useContractWithSigner';

import FixedLenderContext from 'contexts/FixedLenderContext';

import { Market } from 'types/Market';
import { Error } from 'types/Error';
import { UnderlyingData } from 'types/Underlying';
import { Transaction } from 'types/Transaction';

import dictionary from 'dictionary/en.json';

import { getUnderlyingData } from 'utils/utils';

type Props = {
  contractData: any;
  closeModal: any;
};

function SmartPoolModal({ contractData, closeModal }: Props) {
  const fixedLender = useContext(FixedLenderContext);
  const [assetData, setAssetData] = useState<Market>(contractData);

  const [qty, setQty] = useState<number>(0);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const [step, setStep] = useState<number>(1);
  const [pending, setPending] = useState<boolean>(false);

  const [tx, setTx] = useState<Transaction | undefined>(undefined);

  const [minimized, setMinimized] = useState<Boolean>(false);

  let underlyingData: UnderlyingData | undefined = undefined;

  if (assetData?.symbol) {
    underlyingData = getUnderlyingData(
      process.env.NEXT_PUBLIC_NETWORK!,
      assetData.symbol
    );
  }

  const underlyingContract = useContractWithSigner(
    underlyingData!.address,
    underlyingData!.abi
  );

  const fixedLenderWithSigner = useContractWithSigner(
    contractData.address,
    fixedLender?.abi!
  );

  function handleClose() {
    closeModal({});
  }

  async function deposit() {
    if (!qty) {
      return setError({ status: true, msg: dictionary.defaultError });
    }

    const tx =
      await fixedLenderWithSigner?.contractWithSigner?.depositToSmartPool(
        ethers.utils.parseUnits(qty!.toString())
      );

    setTx({ status: 'processing', hash: tx?.hash });

    const status = await tx.wait();

    setTx({ status: 'success', hash: status?.transactionHash });
  }

  async function approve() {
    const approval = await underlyingContract?.contractWithSigner?.approve(
      assetData.address,
      ethers.utils.parseUnits(qty!.toString())
    );
    setPending((pending) => !pending);

    await approval.wait();

    setPending((pending) => !pending);
    setStep((step) => step + 1);
  }

  function handleMinimize() {
    setMinimized((prev) => !prev);
  }

  return (
    <>
      {!minimized && (
        <div className={styles.modal}>
          <div className={styles.closeContainer}>
            <span className={styles.closeButton} onClick={handleClose}>
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
              <div className={styles.fieldContainer}>
                <span>{dictionary.depositTitle}</span>
                <div className={styles.inputContainer}>
                  <Input
                    type="number"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setQty(e.target.valueAsNumber);
                      setError({ status: false, msg: '' });
                    }}
                    value={qty}
                    placeholder="0"
                  />
                </div>
                {error?.status && <p className={styles.error}>{error?.msg}</p>}
                <Stepper currentStep={step} totalSteps={3} />
                <div className={styles.fieldContainer}>
                  {!pending && (
                    <p>
                      {step == 1
                        ? dictionary.permissionApprove
                        : dictionary.permissionDeposit}
                    </p>
                  )}
                  {pending && <p>{dictionary.pendingTransaction}</p>}
                  <div className={styles.buttonContainer}>
                    <Button
                      text={step == 1 ? dictionary.approve : dictionary.deposit}
                      onClick={
                        step == 1 && !pending
                          ? approve
                          : !pending
                          ? deposit
                          : () => {}
                      }
                      className={
                        qty && qty > 0 && !pending ? 'primary' : 'disabled'
                      }
                      disabled={!qty || qty <= 0}
                    />
                  </div>
                </div>
              </div>
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

export default SmartPoolModal;
