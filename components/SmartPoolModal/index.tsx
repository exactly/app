import { useContext, useState, useEffect } from 'react';
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
import LangContext from 'contexts/LangContext';

import { Market } from 'types/Market';
import { Error } from 'types/Error';
import { UnderlyingData } from 'types/Underlying';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';

import { getUnderlyingData } from 'utils/utils';

import keys from './translations.json';

import numbers from 'config/numbers.json';

type Props = {
  contractData: any;
  closeModal: any;
  walletAddress: string;
};

function SmartPoolModal({ contractData, closeModal, walletAddress }: Props) {
  const fixedLender = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [assetData, setAssetData] = useState<Market>(contractData);

  const [qty, setQty] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const [step, setStep] = useState<number>(1);
  const [pending, setPending] = useState<boolean>(false);

  const [tx, setTx] = useState<Transaction | undefined>(undefined);

  const [minimized, setMinimized] = useState<Boolean>(false);

  const [gas, setGas] = useState<Gas | undefined>(undefined);

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

  const filteredFixedLender = fixedLender.find(fl => fl.address == contractData.address)

  const fixedLenderWithSigner = useContractWithSigner(
    contractData.address,
    filteredFixedLender?.abi!
  );

  useEffect(() => {
    checkAllowance();
  }, [contractData.address, walletAddress, underlyingContract]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  async function checkAllowance() {
    const allowance = await underlyingContract?.contractWithSigner?.allowance(
      walletAddress,
      contractData.address
    );

    const formattedAllowance =
      allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty ?? 0;

    if (
      formattedAllowance > amount &&
      !isNaN(amount) &&
      !isNaN(formattedAllowance)
    ) {
      setStep(2);
    }
  }

  function handleClose() {
    closeModal({});
  }

  async function deposit() {
    if (!qty) {
      return setError({ status: true, msg: translations[lang].error });
    }
    try {
      const tx =
        await fixedLenderWithSigner?.contractWithSigner?.depositToSmartPool(
          ethers.utils.parseUnits(qty!.toString())
        );

      setTx({ status: 'processing', hash: tx?.hash });

      const status = await tx.wait();

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      console.log(e);
    }
  }

  async function approve() {
    try {
      const approval = await underlyingContract?.contractWithSigner?.approve(
        assetData.address,
        ethers.utils.parseUnits(numbers.approvalAmount!.toString())
      );
      setPending((pending) => !pending);

      await approval.wait();

      setPending((pending) => !pending);
      setStep((step) => step + 1);
    } catch (e) {
      console.log(e);
    }
  }

  function handleClickAction() {
    if (step === 1 && !pending) {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  }

  async function getMaxAmount() {
    const balance = await underlyingContract?.contract?.balanceOf(
      walletAddress
    );

    const max = balance && ethers.utils.formatEther(balance);

    if (max) {
      setQty(max);
      setError({ status: false, msg: '' });
    }
  }

  async function estimateGas() {
    const gasPriceInGwei =
      await fixedLenderWithSigner?.contractWithSigner?.provider.getGasPrice();

    const estimatedGasCost =
      await fixedLenderWithSigner?.contractWithSigner?.estimateGas.depositToSmartPool(
        ethers.utils.parseUnits(1!.toString())
      );

    if (gasPriceInGwei && estimatedGasCost) {
      const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
      const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
      const eth = parseFloat(gwei) * parseFloat(gasCost);

      setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
    }
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
              <div className={styles.fieldContainer}>
                <span>{translations[lang].depositTitle}</span>
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
                  <span className={styles.maxButton} onClick={getMaxAmount}>
                    MAX
                  </span>
                </div>
                {gas && (
                  <p className={styles.txCost}>
                    <span>{translations[lang].txCost}</span>
                    <span>
                      {gas.eth} ETH / {gas.gwei} GWEI
                    </span>
                  </p>
                )}
                {error?.status && <p className={styles.error}>{error?.msg}</p>}
                <Stepper currentStep={step} totalSteps={3} />
                <div className={styles.fieldContainer}>
                  {!pending && (
                    <p>
                      {step == 1
                        ? translations[lang].permissionApprove
                        : translations[lang].permissionDeposit}
                    </p>
                  )}
                  {pending && <p>{translations[lang].pendingTransaction}</p>}
                  <div className={styles.buttonContainer}>
                    <Button
                      text={
                        step == 1
                          ? translations[lang].approve
                          : translations[lang].deposit
                      }
                      onClick={handleClickAction}
                      className={
                        qty && qty > 0 && !pending ? 'primary' : 'disabled'
                      }
                      disabled={(!qty || qty <= 0) && !pending}
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

export default SmartPoolModal;
