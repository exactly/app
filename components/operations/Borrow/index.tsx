import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Error } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import { getUnderlyingData, getSymbol } from 'utils/utils';
import handleEth from 'utils/handleEth';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { MarketContext } from 'contexts/AddressContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ContractsContext from 'contexts/ContractsContext';

import keys from './translations.json';

import numbers from 'config/numbers.json';

function Borrow() {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { getInstance } = useContext(ContractsContext);

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>(undefined);
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const [error, setError] = useState<Error | undefined>(undefined);
  const [gasError, setGasError] = useState<Error | undefined>(undefined);

  const debounceQty = useDebounce(qty);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined,
  );
  const [underlyingContract, setUnderlyingContract] = useState<Contract | undefined>(undefined);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const liquidity = useMemo(() => {
    if (!accountData) return undefined;

    const limit = accountData[symbol].floatingAvailableAssets;
    return limit ?? undefined;
  }, [accountData, symbol]);

  const ETHrouter =
    web3Provider && symbol == 'WETH' && handleEth(network?.name, web3Provider?.getSigner());

  useEffect(() => {
    setQty('');
  }, [symbol]);

  useEffect(() => {
    getFixedLenderContract();
  }, [market, fixedLenderData]);

  useEffect(() => {
    getUnderlyingContract();
  }, [market, network, symbol]);

  useMemo(() => {
    checkCollateral();
  }, [accountData, symbol, debounceQty]);

  useEffect(() => {
    checkAllowance();
  }, [walletAddress, fixedLenderWithSigner, symbol, debounceQty]);

  useEffect(() => {
    if (underlyingContract && fixedLenderWithSigner) {
      getWalletBalance();
    }
  }, [underlyingContract, fixedLenderWithSigner, walletAddress]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas && accountData) {
      estimateGas();
    }
  }, [fixedLenderWithSigner, accountData]);

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

  function onMax() {
    if (!accountData || !healthFactor) return;

    const decimals = accountData[symbol.toUpperCase()].decimals;
    const adjustFactor = accountData[symbol.toUpperCase()].adjustFactor;
    const usdPrice = accountData[symbol.toUpperCase()].usdPrice;

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);
    const WAD = parseFixed('1', 18);

    const hasDepositedToFloatingPool =
      Number(formatFixed(accountData![symbol].floatingDepositAssets, decimals)) > 0;

    if (!accountData![symbol.toUpperCase()].isCollateral && hasDepositedToFloatingPool) {
      col = col.add(
        accountData![symbol].floatingDepositAssets.mul(accountData![symbol].adjustFactor).div(WAD),
      );
    }

    const debt = healthFactor.debt;

    const safeMaximumBorrow = Number(
      formatFixed(
        col
          .sub(hf.mul(debt).div(WAD))
          .mul(WAD)
          .div(hf)
          .mul(WAD)
          .div(usdPrice)
          .mul(adjustFactor)
          .div(WAD),
        18,
      ),
    ).toFixed(decimals);

    setQty(safeMaximumBorrow);
    setError(undefined);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (!liquidity || !accountData) return;

    const decimals = accountData[symbol.toUpperCase()].decimals;
    const usdPrice = accountData[symbol.toUpperCase()].usdPrice;

    const maxBorrowAssets = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, 'borrow');

    if (e.target.value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(e.target.value)![0];
      if (inputDecimals.length > decimals) return;
    }

    setQty(e.target.value);

    if (liquidity.lt(parseFixed(e.target.value || '0', decimals))) {
      return setError({
        status: true,
        message: translations[lang].availableLiquidityError,
      });
    }

    const WAD = parseFixed('1', 18);

    if (
      maxBorrowAssets.lt(
        parseFixed(e.target.value || '0', decimals)
          .mul(accountData[symbol].usdPrice)
          .div(WAD),
      )
    ) {
      return setError({
        status: true,
        message: translations[lang].borrowLimit,
      });
    }

    setError(undefined);
  }

  async function borrow() {
    if (!accountData) return;

    setLoading(true);

    const decimals = accountData[symbol].decimals;

    try {
      let borrow;

      if (symbol == 'WETH') {
        if (!web3Provider || !ETHrouter) return;

        borrow = await ETHrouter?.borrowETH(qty.toString());
      } else {
        const gasLimit = await getGasLimit(qty);

        borrow = await fixedLenderWithSigner?.borrow(
          ethers.utils.parseUnits(qty!, decimals),
          walletAddress,
          walletAddress,
          {
            gasLimit: gasLimit
              ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier)
              : undefined,
          },
        );
      }

      setTx({ status: 'processing', hash: borrow?.hash });

      const txReceipt = await borrow.wait();
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
          message: isDenied
            ? translations[lang].deniedTransaction
            : translations[lang].notEnoughSlippage,
        });
      } else if (txError) {
        setTx({ status: 'error', hash: txErrorHash });
      } else {
        setError({
          status: true,
          message: translations[lang].generalError,
        });
      }
    }
  }

  function checkCollateral() {
    if (!accountData) return;
    const decimals = accountData[symbol].decimals;

    const isCollateral = Object.keys(accountData).some((market) => {
      return accountData[market].isCollateral;
    });

    const hasDepositedToFloatingPool =
      Number(formatFixed(accountData[symbol].floatingDepositAssets, decimals)) > 0;

    if (isCollateral || hasDepositedToFloatingPool) {
      return;
    } else {
      return setError({
        status: true,
        message: translations[lang].noCollateral,
      });
    }
  }

  async function estimateGas() {
    if (symbol == 'WETH' || !accountData) return;

    try {
      const gasPrice = (await fixedLenderWithSigner?.provider.getFeeData())?.maxFeePerGas;

      const gasLimit = await getGasLimit('1');

      if (gasPrice && gasLimit) {
        const total = formatFixed(gasPrice.mul(gasLimit), 18);

        setGas({ eth: Number(total).toFixed(6) });
      }
    } catch (e) {
      console.log(e);
      setGasError({
        status: true,
        component: 'gas',
      });
    }
  }

  async function getGasLimit(qty: string) {
    if (!accountData) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.borrow(
      ethers.utils.parseUnits(qty, decimals),
      walletAddress,
      walletAddress,
    );

    return gasLimit;
  }

  function getHealthFactor(healthFactor: HealthFactor) {
    setHealthFactor(healthFactor);
  }

  function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      const contractSymbol = getSymbol(contract.address!, network!.name);

      return contractSymbol == symbol;
    });

    const fixedLender = getInstance(
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      `market${symbol}`,
    );

    setFixedLenderWithSigner(fixedLender);
  }

  function getUnderlyingContract() {
    const underlyingData: UnderlyingData | undefined = getUnderlyingData(
      network?.name,
      symbol.toLowerCase(),
    );

    const underlyingContract = getInstance(
      underlyingData!.address,
      underlyingData!.abi,
      `underlying${symbol}`,
    );

    setUnderlyingContract(underlyingContract);
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
            : translations[lang].notEnoughSlippage,
        });
      }
    }
  }

  return (
    <>
      {!tx && (
        <>
          <ModalTitle title={translations[lang].floatingPoolBorrow} />
          <ModalAsset
            asset={symbol!}
            assetTitle={translations[lang].action.toUpperCase()}
            amount={walletBalance}
            amountTitle={translations[lang].walletBalance.toUpperCase()}
          />
          <ModalInput
            onMax={onMax}
            value={qty}
            onChange={handleInputChange}
            symbol={symbol!}
            error={error?.component == 'input'}
          />
          {gasError?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
          {symbol ? (
            <ModalRowHealthFactor
              qty={qty}
              symbol={symbol}
              operation="borrow"
              healthFactorCallback={getHealthFactor}
            />
          ) : (
            <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
          )}
          <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="borrow" line />
          {error && error.component != 'gas' && <ModalError message={error.message} />}
          <div className={styles.buttonContainer}>
            <Button
              text={needsApproval ? translations[lang].approve : translations[lang].borrow}
              className={parseFloat(qty) <= 0 || !qty || error?.status ? 'disabled' : 'primary'}
              onClick={needsApproval ? approve : borrow}
              disabled={parseFloat(qty) <= 0 || !qty || loading || error?.status}
              loading={loading}
            />
          </div>
        </>
      )}
      {tx && <ModalGif tx={tx} tryAgain={borrow} />}
    </>
  );
}

export default Borrow;
