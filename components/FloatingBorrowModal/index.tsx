import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalMinimized from 'components/common/modal/ModalMinimized';
import ModalWrapper from 'components/common/modal/ModalWrapper';
import ModalGif from 'components/common/modal/ModalGif';
import Overlay from 'components/Overlay';
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
import { getUnderlyingData, getSymbol } from 'utils/utils';
import handleEth from 'utils/handleEth';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  editable?: boolean;
  closeModal: (props: any) => void;
};

function FloatingBorrowModal({ data, editable, closeModal }: Props) {
  const { market } = data;

  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const { address } = useContext(AddressContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { minimized, setMinimized } = useContext(ModalStatusContext);

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>(undefined);
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [collateralFactor, setCollateralFactor] = useState<number | undefined>(undefined);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [liquidity, setLiquidity] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>(undefined);
  const [gasError, setGasError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const marketAddress = editable ? address?.value ?? market : market;

  const symbol = getSymbol(marketAddress, network?.name);

  const ETHrouter =
    web3Provider && symbol == 'WETH' && handleEth(network?.name, web3Provider?.getSigner());

  const underlyingData: UnderlyingData | undefined = getUnderlyingData(
    network?.name,
    symbol.toLowerCase()
  );

  const underlyingContract = getContractData(
    network?.name,
    underlyingData!.address,
    underlyingData!.abi
  );

  useEffect(() => {
    getFixedLenderContract();
  }, [address, market, fixedLenderData]);

  useEffect(() => {
    checkAllowance();
    checkLiquidity();
    checkCollateral();
  }, [walletAddress, fixedLenderWithSigner, symbol, qty]);

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

  async function onMax() {
    if (!accountData || !healthFactor || !collateralFactor) return;

    const rate = ethers.utils.formatEther(accountData[symbol.toUpperCase()]?.oraclePrice);

    const adjustFactor = ethers.utils.formatEther(accountData[symbol.toUpperCase()]?.adjustFactor);

    const beforeBorrowLimit = healthFactor
      ? healthFactor!.collateral * parseFloat(adjustFactor) - healthFactor!.debt
      : 0;

    const afterBorrowLimit =
      beforeBorrowLimit - ((parseFloat(qty) * parseFloat(rate)) / collateralFactor || 0);

    if ((parseFloat(qty) * parseFloat(rate)) / collateralFactor > afterBorrowLimit) return;

    //we should display the minimum between the liquidity and borrowLimit

    setQty((afterBorrowLimit / parseFloat(rate)).toString());
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);

    if (liquidity && liquidity < e.target.valueAsNumber) {
      return setError({
        status: true,
        message: translations[lang].availableLiquidityError
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
            gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * 1.1) : undefined
          }
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

  async function checkLiquidity() {
    if (!accountData) return;

    const decimals = accountData[symbol].decimals;

    const limit =
      data && ethers.utils.formatUnits(accountData[symbol].floatingAvailableAssets, decimals);

    limit && setLiquidity(parseFloat(limit));
  }

  async function checkCollateral() {
    if (!accountData) return;
    const decimals = accountData[symbol].decimals;

    const isCollateral = Object.keys(accountData).some((market) => {
      return accountData[market].isCollateral;
    });

    const hasDepositedToFloatingPool =
      parseFloat(ethers.utils.formatUnits(accountData[symbol].floatingBorrowAssets, decimals)) > 0;

    if (isCollateral || hasDepositedToFloatingPool) {
      return;
    } else {
      return setError({
        status: true,
        message: translations[lang].noCollateral
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
        component: 'gas'
      });
    }
  }

  async function getGasLimit(qty: string) {
    if (!accountData) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.borrow(
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

  return (
    <>
      {!minimized && (
        <ModalWrapper closeModal={closeModal}>
          {!tx && (
            <>
              <ModalTitle title={translations[lang].floatingPoolBorrow} />
              <ModalAsset asset={symbol!} amount={walletBalance} />
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
              <ModalRowBorrowLimit
                healthFactor={healthFactor}
                collateralFactor={collateralFactor}
                qty={qty}
                symbol={symbol!}
                operation="borrow"
              />
              {error && error.component != 'gas' && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={needsApproval ? translations[lang].approve : translations[lang].borrow}
                  className={
                    parseFloat(qty) <= 0 || !qty || error?.status ? 'disabled' : 'secondary'
                  }
                  onClick={needsApproval ? approve : borrow}
                  disabled={parseFloat(qty) <= 0 || !qty || loading || error?.status}
                  loading={loading}
                />
              </div>
            </>
          )}
          {tx && <ModalGif tx={tx} tryAgain={borrow} />}
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

export default FloatingBorrowModal;
