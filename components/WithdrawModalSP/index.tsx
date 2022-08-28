import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';
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
import Overlay from 'components/Overlay';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';
import ModalExpansionPanelWrapper from 'components/common/modal/ModalExpansionPanelWrapper';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Error } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';
import { getSymbol } from 'utils/utils';
import handleEth from 'utils/handleEth';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function WithdrawModalSP({ data, closeModal }: Props) {
  const { symbol, assets } = data;

  const { walletAddress, web3Provider, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const { minimized, setMinimized } = useContext(ModalStatusContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [collateralFactor, setCollateralFactor] = useState<number | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const parsedAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);

  const formattedAmount = formatNumber(parsedAmount, symbol!);

  const ETHrouter =
    web3Provider && symbol == 'WETH' && handleEth(network?.name, web3Provider?.getSigner());

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    checkAllowance();
  }, [walletAddress, fixedLenderWithSigner, symbol, qty]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  async function checkAllowance() {
    if (symbol != 'WETH' || !ETHrouter || !walletAddress || !fixedLenderWithSigner) return;

    const allowance = await ETHrouter.checkAllowance(walletAddress, fixedLenderWithSigner);

    if (
      (allowance && parseFloat(allowance) < parseFloat(qty)) ||
      (allowance && parseFloat(allowance) == 0 && !qty)
    ) {
      setNeedsApproval(true);
    }
  }

  function onMax() {
    setQty(parsedAmount);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.valueAsNumber > parseFloat(parsedAmount)) {
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

  async function withdraw() {
    setLoading(true);

    try {
      let decimals;
      let withdraw;

      if (symbol == 'WETH') {
        if (!ETHrouter) return;

        decimals = 18;

        withdraw = await ETHrouter.withdrawETH(qty);
      } else {
        if (!accountData || !symbol) return;

        const gasLimit = await getGasLimit(qty);

        decimals = accountData[symbol].decimals;

        withdraw = await fixedLenderWithSigner?.withdraw(
          ethers.utils.parseUnits(qty, decimals),
          walletAddress,
          walletAddress,
          {
            gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * 1.1) : undefined
          }
        );
      }

      setTx({ status: 'processing', hash: withdraw?.hash });

      const txReceipt = await withdraw.wait();
      setLoading(false);

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
          message: isDenied && translations[lang].deniedTransaction
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

      const gasLimit = await getGasLimit('1');

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

    const gasLimit = await fixedLenderWithSigner?.estimateGas.withdraw(
      ethers.utils.parseUnits(qty, decimals),
      walletAddress,
      walletAddress
    );

    return gasLimit;
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

  async function approve() {
    if (symbol == 'WETH') {
      if (!web3Provider || !ETHrouter || !fixedLenderWithSigner) return;

      try {
        setLoading(true);

        const approve = await ETHrouter.approve(fixedLenderWithSigner);

        await approve.wait();

        setLoading(false);
        setNeedsApproval(false);
      } catch (e: any) {
        setLoading(false);

        const isDenied = e?.message?.includes('User denied');

        setError({
          status: true,
          message: isDenied
            ? translations[lang].deniedTransaction
            : translations[lang].notEnoughSlippage
        });
      }
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
              <ModalTitle title={translations[lang].withdraw} />
              <ModalAsset asset={symbol!} amount={parsedAmount} />
              <ModalInput
                onMax={onMax}
                value={qty}
                onChange={handleInputChange}
                symbol={symbol!}
                error={error?.component == 'input'}
              />
              {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].exactlyBalance} value={formattedAmount} />
              <ModalExpansionPanelWrapper>
                {symbol ? (
                  <ModalRowHealthFactor
                    qty={qty}
                    symbol={symbol}
                    operation="withdraw"
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
                  operation="withdraw"
                />
              </ModalExpansionPanelWrapper>

              {error && error.component != 'gas' && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={needsApproval ? translations[lang].approve : translations[lang].withdraw}
                  className={
                    parseFloat(qty) <= 0 || !qty || error?.status ? 'secondaryDisabled' : 'tertiary'
                  }
                  disabled={parseFloat(qty) <= 0 || !qty || loading || error?.status}
                  onClick={needsApproval ? approve : withdraw}
                  loading={loading}
                  color="primary"
                />
              </div>
            </>
          )}
          {tx && <ModalGif tx={tx} tryAgain={withdraw} />}
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

export default WithdrawModalSP;
