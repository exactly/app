import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';
import { ethers, Contract } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';
import ModalExpansionPanelWrapper from 'components/common/modal/ModalExpansionPanelWrapper';

import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Error } from 'types/Error';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/AddressContext';
import ContractsContext from 'contexts/ContractsContext';

import formatNumber from 'utils/formatNumber';
import { getSymbol } from 'utils/utils';
import handleEth from 'utils/handleEth';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

function Withdraw() {
  const { walletAddress, web3Provider, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);
  const { getInstance } = useContext(ContractsContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [isMax, setIsMax] = useState<boolean>(false);

  const debounceQty = useDebounce(qty);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const assets = useMemo(() => {
    if (!accountData) return undefined;

    return accountData[symbol].floatingDepositAssets;
  }, [symbol, accountData]);

  const [parsedAmount, formattedAmount] = useMemo(() => {
    if (!assets || !symbol) return ['0', '0'];

    const parsedAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);
    return [parsedAmount, formatNumber(parsedAmount, symbol!)];
  }, [assets, symbol]);

  const ETHrouter =
    web3Provider && symbol == 'WETH' && handleEth(network?.name, web3Provider?.getSigner());

  useEffect(() => {
    setQty('');
  }, [symbol]);

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    checkAllowance();
  }, [walletAddress, fixedLenderWithSigner, symbol, debounceQty]);

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

    //we enable max flag if user clicks max
    setIsMax(true);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (!accountData || !symbol) return;
    const decimals = accountData[symbol.toUpperCase()].decimals;

    if (e.target.value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(e.target.value)![0];
      if (inputDecimals.length > decimals) return;
    }

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

    //we disable max flag if user changes input
    isMax && setIsMax(false);
  }

  async function withdraw() {
    if (!accountData) return;

    setLoading(true);

    try {
      let decimals;
      let withdraw;

      if (symbol == 'WETH') {
        if (!ETHrouter) return;

        decimals = 18;

        if (isMax) {
          withdraw = await ETHrouter.redeemETH(accountData[symbol].floatingDepositShares);
        } else {
          withdraw = await ETHrouter.withdrawETH(qty);
        }
      } else {
        if (!accountData || !symbol) return;

        const gasLimit = await getGasLimit(qty);
        decimals = accountData[symbol].decimals;

        if (isMax) {
          withdraw = await fixedLenderWithSigner?.redeem(
            accountData[symbol].floatingDepositShares,
            walletAddress,
            walletAddress,
            {
              gasLimit: gasLimit
                ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier)
                : undefined
            }
          );
        } else {
          withdraw = await fixedLenderWithSigner?.withdraw(
            ethers.utils.parseUnits(qty, decimals),
            walletAddress,
            walletAddress,
            {
              gasLimit: gasLimit
                ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier)
                : undefined
            }
          );
        }
      }

      setTx({ status: 'processing', hash: withdraw?.hash });

      const txReceipt = await withdraw.wait();
      setLoading(false);

      if (txReceipt.status == 1) {
        setTx({ status: 'success', hash: txReceipt?.transactionHash });
      } else {
        setTx({ status: 'error', hash: txReceipt?.transactionHash });
      }

      getAccountData();
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

  function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      const contractSymbol = getSymbol(contract.address!, network!.name);

      return contractSymbol == symbol;
    });

    const fixedLender = getInstance(
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      `market${symbol}`
    );

    setFixedLenderWithSigner(fixedLender);
  }

  return (
    <>
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
              <ModalRowHealthFactor qty={qty} symbol={symbol} operation="withdraw" />
            ) : (
              <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
            )}
            <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="withdraw" />
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
    </>
  );
}

export default Withdraw;
