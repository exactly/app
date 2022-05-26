import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import request from 'graphql-request';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalClose from 'components/common/modal/ModalClose';
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

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { HealthFactor } from 'types/HealthFactor';
import { Error } from 'types/Error';

import { getContractData } from 'utils/contracts';
import { getUnderlyingData } from 'utils/utils';

import numbers from 'config/numbers.json';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import PreviewerContext from 'contexts/PreviewerContext';
import AuditorContext from 'contexts/AuditorContext';

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

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);
  const auditorData = useContext(AuditorContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [pending, setPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor>();
  const [depositedAmount, setDepositedAmount] = useState<string>();
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

  const previewerContract = getContractData(
    network?.name,
    previewerData.address!,
    previewerData.abi!
  );

  useEffect(() => {
    getFixedLenderContract();
    getWalletBalance();
    getUserDeposits();
  }, [fixedLenderData]);

  useEffect(() => {
    if (!walletAddress) return;
    getHealthFactor();
  }, [walletAddress]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  useEffect(() => {
    checkAllowance();
  }, [market, walletAddress, underlyingContract]);

  async function checkAllowance() {
    const allowance = await underlyingContract?.allowance(walletAddress, market);

    const formattedAllowance = allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty == '' ? 0 : parseFloat(qty);

    if (formattedAllowance > amount && !isNaN(amount) && !isNaN(formattedAllowance)) {
      setStep(2);
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
      setStep((step) => step + 1);
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

  async function getHealthFactor() {
    try {
      const accountLiquidity = await previewerContract?.accountLiquidity(
        auditorData.address,
        walletAddress
      );

      const collateral = parseFloat(ethers.utils.formatEther(accountLiquidity[0]));
      const debt = parseFloat(ethers.utils.formatEther(accountLiquidity[1]));

      setHealthFactor({ debt, collateral });
    } catch (e) {
      console.log(e);
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

        setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      setError({
        status: true,
        message: translations[lang].notEnoughBalance,
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
              <ModalRow text={translations[lang].interestRate} value="X %" line />
              {healthFactor && symbol ? (
                <ModalRowHealthFactor
                  healthFactor={healthFactor}
                  qty={qty}
                  symbol={symbol}
                  operation="deposit"
                />
              ) : (
                <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
              )}
              {/* <ModalRow text={translations[lang].borrowLimit} values={['100K', '150K']} /> */}
              <ModalStepper currentStep={step} totalSteps={3} />
              {error && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={step == 1 ? translations[lang].approve : translations[lang].deposit}
                  loading={loading}
                  className={qty && qty > '0' && !error?.status ? 'primary' : 'disabled'}
                  disabled={((!qty || qty <= '0') && !pending) || loading || error?.status}
                  onClick={handleClickAction}
                />
              </div>
            </>
          )}
          {tx && <ModalGif tx={tx} />}
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
