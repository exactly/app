import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalMinimized from 'components/common/modal/ModalMinimized';
import ModalWrapper from 'components/common/modal/ModalWrapper';
import ModalGif from 'components/common/modal/ModalGif';
import Overlay from 'components/Overlay';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Error } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import { getContractData } from 'utils/contracts';
import { getUnderlyingData, getSymbol } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import PreviewerContext from 'contexts/PreviewerContext';
import AccountDataContext from 'contexts/AccountDataContext';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  editable?: boolean;
  closeModal: (props: any) => void;
};

function BorrowModal({ data, editable, closeModal }: Props) {
  const { maturity, market } = data;

  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const { date, address } = useContext(AddressContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>(undefined);
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<Boolean>(false);
  const [fixedRate, setFixedRate] = useState<string | undefined>('0.00');
  const [slippage, setSlippage] = useState<string>('0.00');
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [collateralFactor, setCollateralFactor] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const marketAddress = editable ? address?.value ?? market : market;

  const symbol = getSymbol(marketAddress, network?.name);

  const underlyingData: UnderlyingData | undefined = getUnderlyingData(
    network?.name,
    symbol.toLowerCase()
  );

  const underlyingContract = getContractData(
    network?.name,
    underlyingData!.address,
    underlyingData!.abi
  );

  const previewerContract = getContractData(
    network?.name,
    previewerData.address!,
    previewerData.abi!
  );

  useEffect(() => {
    getFixedLenderContract();
  }, [address, market, fixedLenderData]);

  useEffect(() => {
    if (underlyingContract && fixedLenderWithSigner) {
      getWalletBalance();
    }
  }, [underlyingContract, fixedLenderWithSigner]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  useEffect(() => {
    if (qty) {
      getFeeAtMaturity();
    }
  }, [qty, date, maturity]);

  async function getWalletBalance() {
    const walletBalance = await underlyingContract?.balanceOf(walletAddress);
    const decimals = await underlyingContract?.decimals();
    const formattedBalance = walletBalance && ethers.utils.formatUnits(walletBalance, decimals);

    if (formattedBalance) {
      setWalletBalance(formattedBalance);
    }
  }

  async function onMax() {
    walletBalance && setQty(walletBalance);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);
  }

  async function borrow() {
    setLoading(true);

    try {
      const maxAmount = parseFloat(qty!) * (1 + parseFloat(slippage) / 100);
      const decimals = await fixedLenderWithSigner?.decimals();

      const borrow = await fixedLenderWithSigner?.borrowAtMaturity(
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(qty!, decimals),
        ethers.utils.parseUnits(`${maxAmount}`, decimals),
        walletAddress,
        walletAddress
      );

      setTx({ status: 'processing', hash: borrow?.hash });

      const status = await borrow.wait();
      setLoading(false);

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
      const decimals = await fixedLenderWithSigner?.decimals();

      const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.borrowAtMaturity(
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(`1`, decimals),
        ethers.utils.parseUnits(`2`, decimals),
        walletAddress,
        walletAddress
      );

      if (gasPriceInGwei && estimatedGasCost) {
        const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
        const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
        const eth = parseFloat(gwei) * parseFloat(gasCost);

        setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      console.log(e);
      setError({
        status: true,
        component: 'gas'
      });
    }
  }

  async function getFeeAtMaturity() {
    if (!qty || parseFloat(qty) <= 0) return;

    try {
      const decimals = await fixedLenderWithSigner?.decimals();

      const feeAtMaturity = await previewerContract?.previewBorrowAtMaturity(
        fixedLenderWithSigner!.address,
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(qty, decimals)
      );

      const fixedRate =
        ((parseFloat(ethers.utils.formatUnits(feeAtMaturity, decimals)) - parseFloat(qty)) /
          parseFloat(qty)) *
        100;

      setFixedRate(fixedRate.toFixed(2));
    } catch (e) {
      console.log(e);
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
              <ModalTitle title={translations[lang].borrow} />
              <ModalAsset
                asset={symbol!}
                amount={walletBalance}
                editable={editable}
                defaultAddress={marketAddress}
              />
              <ModalMaturityEditable
                text={translations[lang].maturityPool}
                value={date?.label ?? parseTimestamp(maturity)}
                editable={editable}
              />
              <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol!} />
              {error?.component !== 'gas' && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].interestRate} value={`${fixedRate}%`} line />
              <ModalRowEditable
                text={translations[lang].maximumBorrowRate}
                value={slippage}
                editable={editSlippage}
                symbol="%"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSlippage(e.target.value);
                }}
                onClick={() => {
                  if (slippage == '') setSlippage('0.5');
                  setEditSlippage((prev) => !prev);
                }}
                line
              />
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
                  text={translations[lang].borrow}
                  className={
                    parseFloat(qty) <= 0 || !qty || error?.status ? 'disabled' : 'secondary'
                  }
                  onClick={borrow}
                  disabled={parseFloat(qty) <= 0 || !qty || loading || error?.status}
                  loading={loading}
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

export default BorrowModal;
