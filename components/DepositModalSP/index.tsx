import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import request from 'graphql-request';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalMinimized from 'components/common/modal/ModalMinimized';
import ModalWrapper from 'components/common/modal/ModalWrapper';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import Overlay from 'components/Overlay';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Error } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import { getContractData } from 'utils/contracts';
import { getUnderlyingData } from 'utils/utils';
import getSmartPoolInterestRate from 'utils/getSmartPoolInterestRate';

import numbers from 'config/numbers.json';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';

import getSubgraph from 'utils/getSubgraph';
import formatSmartPoolDeposits from 'utils/formatSmartPoolDeposits';

import { getSmartPoolDepositsQuery, getSmartPoolWithdrawsQuery } from 'queries';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function DepositModalSP({ data, closeModal }: Props) {
  const { market, symbol } = data;

  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [depositedAmount, setDepositedAmount] = useState<string>();
  const [rate, setRate] = useState<string | undefined>(undefined);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [collateralFactor, setCollateralFactor] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  let underlyingData: UnderlyingData | undefined = undefined;

  if (symbol) {
    underlyingData = getUnderlyingData(network?.name, symbol.toLowerCase());
  }

  const underlyingContract = getContractData(
    network?.name,
    underlyingData!.address,
    underlyingData!.abi,
    web3Provider?.getSigner()
  );

  useEffect(() => {
    getFixedLenderContract();
    getWalletBalance();
    getUserDeposits();
  }, [fixedLenderData]);

  useEffect(() => {
    if (fixedLenderWithSigner) {
      if (step == 1) {
        estimateApprovalGasCost();
      } else if (step == 2) {
        estimateGas();
      }
    }
  }, [fixedLenderWithSigner, step]);

  useEffect(() => {
    if (!fixedLenderWithSigner || !network) return;

    getInterestRate();
  }, [fixedLenderWithSigner, network]);

  useEffect(() => {
    checkAllowance();
  }, [market, walletAddress, underlyingContract]);

  async function checkAllowance() {
    const allowance = await underlyingContract?.allowance(walletAddress, market);

    const formattedAllowance = allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty == '' ? 0 : parseFloat(qty);

    if (formattedAllowance > amount && !isNaN(amount) && !isNaN(formattedAllowance)) {
      setStep(2);
    } else {
      setStep(1);
    }
  }

  async function approve() {
    try {
      const approval = await underlyingContract?.approve(
        market,
        ethers.utils.parseUnits(numbers.approvalAmount!.toString())
      );

      //we set the transaction as pending
      setPending((pending) => !pending);

      await approval.wait();

      //we set the transaction as done
      setPending((pending) => !pending);
      setLoading(false);

      //once the tx is done we update the step
      setStep(2);
    } catch (e) {
      setLoading(false);

      setError({
        status: true
      });
    }
  }

  async function getWalletBalance() {
    const walletBalance = await underlyingContract?.balanceOf(walletAddress);

    const formattedBalance = walletBalance && ethers.utils.formatEther(walletBalance);

    if (formattedBalance) {
      setWalletBalance(formattedBalance);
    }
  }

  async function getUserDeposits() {
    if (!walletAddress || !symbol) return;

    const subgraphUrl = getSubgraph(network?.name);

    const getSmartPoolDeposits = await request(
      subgraphUrl,
      getSmartPoolDepositsQuery(walletAddress)
    );

    const getSmartPoolWithdraws = await request(
      subgraphUrl,
      getSmartPoolWithdrawsQuery(walletAddress)
    );

    const deposits = formatSmartPoolDeposits(
      getSmartPoolDeposits.deposits,
      getSmartPoolWithdraws.withdraws,
      network?.name!
    );

    const amount = deposits[symbol?.toUpperCase()]?.assets;
    const formattedAmount = amount && ethers.utils.formatEther(`${amount}`);

    !formattedAmount ? setDepositedAmount('0') : setDepositedAmount(formattedAmount);
  }

  async function onMax() {
    if (walletBalance) {
      setQty(walletBalance);
      setError(undefined);
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (step != 1 && walletBalance && e.target.valueAsNumber > parseFloat(walletBalance)) {
      setError({
        status: true,
        message: translations[lang].insufficientBalance,
        component: 'input'
      });
    } else {
      setError(undefined);
    }

    setQty(e.target.value);
  }

  async function deposit() {
    try {
      const deposit = await fixedLenderWithSigner?.deposit(
        ethers.utils.parseUnits(qty!.toString()),
        walletAddress
      );

      setTx({ status: 'processing', hash: deposit?.hash });

      const status = await deposit.wait();

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      setLoading(false);

      setError({
        status: true
      });
    }
  }

  async function estimateGas() {
    try {
      const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

      const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.deposit(
        ethers.utils.parseUnits(`${numbers.estimateGasAmount}`),
        walletAddress
      );

      if (gasPriceInGwei && estimatedGasCost) {
        const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
        const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
        const eth = parseFloat(gwei) * parseFloat(gasCost);

        setGas({ eth: eth.toFixed(6), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      setError({
        status: true,
        component: 'gas'
      });
    }
  }

  async function estimateApprovalGasCost() {
    try {
      const gasPriceInGwei = await underlyingContract?.provider.getGasPrice();

      const estimatedGasCost = await underlyingContract?.estimateGas.approve(
        market,
        ethers.utils.parseUnits(numbers.approvalAmount!.toString())
      );

      if (gasPriceInGwei && estimatedGasCost) {
        const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
        const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
        const eth = parseFloat(gwei) * parseFloat(gasCost);

        setGas({ eth: eth.toFixed(6), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      console.log(e);
      setError({
        status: true,
        message: translations[lang].error,
        component: 'gas'
      });
    }
  }

  function handleClickAction() {
    setLoading(true);
    if (step === 1 && !pending) {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  }

  async function getInterestRate() {
    try {
      const interestRate = await getSmartPoolInterestRate(
        network?.name!,
        fixedLenderWithSigner?.address!
      );

      setRate(interestRate);
    } catch (e) {
      console.log(e);
    }
  }

  function getHealthFactor(healthFactor: HealthFactor) {
    setHealthFactor(healthFactor);

    if (accountData && symbol) {
      const collateralFactor = ethers.utils.formatEther(
        accountData[symbol.toUpperCase()]?.collateralFactor
      );
      setCollateralFactor(parseFloat(collateralFactor));
    }
  }

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      const args: Array<string> | undefined = contract?.args;
      const contractSymbol: string | undefined = args && args[1];

      return contractSymbol == symbol;
    });

    const fixedLender = await getContractData(
      network?.name,
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      web3Provider?.getSigner()
    );

    setFixedLenderWithSigner(fixedLender);
  }

  return (
    <>
      {!minimized && (
        <ModalWrapper closeModal={closeModal}>
          {!tx && (
            <>
              <ModalTitle title={translations[lang].deposit} />
              <ModalAsset asset={symbol!} amount={walletBalance} />
              <ModalInput
                onMax={onMax}
                value={qty}
                onChange={handleInputChange}
                symbol={symbol!}
                error={error?.component == 'input'}
              />
              {error?.component !== 'gas' && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].exactlyBalance} value={depositedAmount} line />
              <ModalRow
                text={translations[lang].interestRate}
                value={rate ? `${rate}%` : '0%'}
                line
              />
              {symbol ? (
                <ModalRowHealthFactor
                  qty={qty}
                  symbol={symbol}
                  operation="deposit"
                  healthFactorCallback={getHealthFactor}
                />
              ) : (
                <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
              )}
              <ModalRowBorrowLimit
                healthFactor={healthFactor}
                collateralFactor={collateralFactor}
                qty={qty}
                symbol={symbol!}
                operation="deposit"
              />
              <ModalStepper currentStep={step} totalSteps={3} />
              {error && error.component != 'gas' && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={step == 1 ? translations[lang].approve : translations[lang].deposit}
                  loading={loading}
                  className={qty && parseFloat(qty) > 0 && !error?.status ? 'primary' : 'disabled'}
                  disabled={
                    ((!qty || parseFloat(qty) <= 0) && !pending) || loading || error?.status
                  }
                  onClick={handleClickAction}
                />
              </div>
            </>
          )}
          {tx && symbol && fixedLenderWithSigner && (
            <ModalGif tx={tx} symbol={symbol} contract={fixedLenderWithSigner} />
          )}
        </ModalWrapper>
      )}

      {tx && minimized && (
        <ModalMinimized
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
              ? closeModal
              : () => {
                  setMinimized((prev) => !prev);
                }
          }
        />
      )}
    </>
  );
}

export default DepositModalSP;
