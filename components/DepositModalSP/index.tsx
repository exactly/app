import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

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
import ModalExpansionPanelWrapper from 'components/common/modal/ModalExpansionPanelWrapper';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Error } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import { getContractData } from 'utils/contracts';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import formatNumber from 'utils/formatNumber';
import handleEth from 'utils/handleEth';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import keys from './translations.json';

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

  const { minimized, setMinimized } = useContext(ModalStatusContext);
  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [depositedAmount, setDepositedAmount] = useState<string>();
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
  }, [fixedLenderData, walletAddress]);

  useEffect(() => {
    if (fixedLenderWithSigner) {
      if (step == 1) {
        estimateApprovalGasCost();
      } else if (step == 2) {
        estimateGas();
      }
    }
  }, [fixedLenderWithSigner, step, qty]);

  useEffect(() => {
    checkAllowance();
  }, [market, walletAddress, underlyingContract]);

  async function checkAllowance() {
    if (symbol == 'WETH') {
      return setStep(2);
    }

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
    if (symbol == 'WETH') return;

    try {
      const gasLimit = await getApprovalGasLimit();

      const approval = await underlyingContract?.approve(market, ethers.constants.MaxUint256, {
        gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * 1.1) : undefined
      });

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
    let walletBalance;
    let decimals;

    if (symbol == 'WETH') {
      walletBalance = await web3Provider?.getBalance(walletAddress!);
      decimals = 18;
    } else {
      walletBalance = await underlyingContract?.balanceOf(walletAddress);
      decimals = await underlyingContract?.decimals();
    }

    const formattedBalance = walletBalance && ethers.utils.formatUnits(walletBalance, decimals);

    if (formattedBalance) {
      setWalletBalance(formattedBalance);
    }
  }

  async function getUserDeposits() {
    if (!walletAddress || !symbol || !accountData) return;

    const amount = accountData[symbol.toUpperCase()]?.floatingDepositAssets;
    const decimals = await underlyingContract?.decimals();

    const formattedAmount =
      amount && formatNumber(ethers.utils.formatUnits(amount, decimals), symbol);

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
      if (!accountData || !symbol) return;

      const decimals = accountData[symbol].decimals;

      let deposit;

      if (symbol == 'WETH') {
        if (!web3Provider) return;

        const ETHrouter = handleEth(network?.name, web3Provider?.getSigner());

        deposit = await ETHrouter?.depositETH(qty!);
      } else {
        const gasLimit = await getGasLimit(qty);

        deposit = await fixedLenderWithSigner?.deposit(
          ethers.utils.parseUnits(qty, decimals),
          walletAddress,
          {
            gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * 1.1) : undefined
          }
        );
      }

      setTx({ status: 'processing', hash: deposit?.hash });

      const txReceipt = await deposit.wait();

      if (txReceipt.status == 1) {
        setTx({ status: 'success', hash: txReceipt?.transactionHash });
      } else {
        setTx({ status: 'error', hash: txReceipt?.transactionHash });
      }
    } catch (e: any) {
      console.log(e);
      setLoading(false);

      const isDenied = e?.message?.includes('User denied');

      const txError = e?.message?.includes(`"status":0`);
      let txErrorHash = undefined;

      if (txError) {
        const regex = new RegExp(/\"hash":"(.*?)\"/g); //regex to get all between ("hash":") and (")
        const preTxHash = e?.message?.match(regex); //get the hash from plain text by the regex
        txErrorHash = preTxHash[0].substring(8, preTxHash[0].length - 1); //parse the string to get the txHash only
      }

      if (isDenied) {
        setError({
          status: true,
          message: isDenied
            ? translations[lang].deniedTransaction
            : translations[lang].notEnoughSlippage
        });
      } else if (txError) {
        setTx({ status: 'error', hash: txErrorHash });
      } else {
        setError({
          status: true,
          message: translations[lang].generalError
        });
      }
    }
  }

  async function estimateGas() {
    if (symbol == 'WETH') return;

    try {
      const gasPrice = (await fixedLenderWithSigner?.provider.getFeeData())?.maxFeePerGas;

      const gasLimit = await getGasLimit(qty);

      if (gasPrice && gasLimit) {
        const total = formatFixed(gasPrice.mul(gasLimit), 18);

        setGas({ eth: Number(total).toFixed(6) });
      }
    } catch (e) {
      setError({
        status: true,
        component: 'gas'
      });
    }
  }

  async function getGasLimit(qty: string) {
    if (!accountData || !symbol) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.deposit(
      ethers.utils.parseUnits(qty, decimals),
      walletAddress
    );

    return gasLimit;
  }

  async function getApprovalGasLimit() {
    const gasLimit = await underlyingContract?.estimateGas.approve(
      market,
      ethers.constants.MaxUint256
    );

    return gasLimit;
  }

  async function estimateApprovalGasCost() {
    if (symbol == 'WETH') return;

    try {
      const gasPrice = (await fixedLenderWithSigner?.provider.getFeeData())?.maxFeePerGas;

      const gasLimit = await getApprovalGasLimit();

      if (gasPrice && gasLimit) {
        const total = formatFixed(gasPrice.mul(gasLimit), 18);

        setGas({ eth: Number(total).toFixed(6) });
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
    if (step === 1 && !pending && symbol != 'WETH') {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  }

  function getHealthFactor(healthFactor: HealthFactor) {
    setHealthFactor(healthFactor);

    if (accountData && symbol) {
      const collateralFactor = ethers.utils.formatEther(
        accountData[symbol.toUpperCase()]?.adjustFactor
      );
      setCollateralFactor(parseFloat(collateralFactor));
    }
  }

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      const contractSymbol = getSymbol(contract.address!, network!.name);

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
              <ModalTitle title={translations[lang].variableRateDeposit} />
              <ModalAsset asset={symbol!} amount={walletBalance} />
              <ModalInput
                onMax={onMax}
                value={qty}
                onChange={handleInputChange}
                symbol={symbol!}
                error={error?.component == 'input'}
              />
              {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].exactlyBalance} value={depositedAmount} />
              <ModalExpansionPanelWrapper>
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
              </ModalExpansionPanelWrapper>
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
          {tx && <ModalGif tx={tx} tryAgain={deposit} />}
        </ModalWrapper>
      )}

      {tx && minimized && (
        <ModalMinimized
          tx={tx}
          handleMinimize={() => {
            setMinimized((prev: boolean) => !prev);
          }}
        />
      )}

      {!minimized && (
        <Overlay
          closeModal={
            !tx || tx.status == 'success'
              ? closeModal
              : () => {
                  setMinimized((prev: boolean) => !prev);
                }
          }
        />
      )}
    </>
  );
}

export default DepositModalSP;
