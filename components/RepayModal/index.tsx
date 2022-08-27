import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
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
import { UnderlyingData } from 'types/Underlying';

import parseTimestamp from 'utils/parseTimestamp';
import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import handleEth from 'utils/handleEth';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';
import PreviewerContext from 'contexts/PreviewerContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function RepayModal({ data, closeModal }: Props) {
  const { symbol, maturity, assets, fee } = data;

  const { walletAddress, web3Provider, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const previewerData = useContext(PreviewerContext);
  const { minimized, setMinimized } = useContext(ModalStatusContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const parsedFee = ethers.utils.formatUnits(fee, decimals[symbol! as keyof Decimals]);
  const parsedAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);
  const finalAmount = (parseFloat(parsedAmount) + parseFloat(parsedFee)).toString();

  const [qty, setQty] = useState<string>('');
  const [slippage, setSlippage] = useState<string>(formatNumber(finalAmount, symbol!));
  const [isLateRepay, setIsLateRepay] = useState<boolean>(false);

  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [collateralFactor, setCollateralFactor] = useState<number | undefined>(undefined);
  const [repayAmount, setRepayAmount] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const previewerContract = getContractData(
    network?.name,
    previewerData.address!,
    previewerData.abi!
  );

  const underlyingData: UnderlyingData | undefined = getUnderlyingData(
    network?.name,
    symbol?.toLowerCase()
  );

  const underlyingContract = getContractData(
    network?.name,
    underlyingData!.address,
    underlyingData!.abi,
    web3Provider?.getSigner()
  );

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  useEffect(() => {
    const repay = Date.now() / 1000 > parseInt(maturity);

    setIsLateRepay(repay);
  }, [maturity]);

  useEffect(() => {
    if (qty == '') return;
    previewRepayAtMaturity();
  }, [qty]);

  useEffect(() => {
    checkAllowance();
  }, [symbol, walletAddress, underlyingContract]);

  async function checkAllowance() {
    if (symbol == 'WETH' || !fixedLenderWithSigner) {
      return;
    }

    const allowance = await underlyingContract?.allowance(
      walletAddress,
      fixedLenderWithSigner?.address
    );

    const formattedAllowance = allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty == '' ? 0 : parseFloat(qty);

    if (formattedAllowance > amount && !isNaN(amount) && !isNaN(formattedAllowance)) {
      setNeedsApproval(false);
    } else {
      setNeedsApproval(true);
    }
  }

  async function approve() {
    if (symbol == 'WETH' || !fixedLenderWithSigner) return;

    try {
      setLoading(true);

      const gasLimit = await getApprovalGasLimit();

      const approval = await underlyingContract?.approve(
        fixedLenderWithSigner?.address,
        ethers.constants.MaxUint256,
        { gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * 1.1) : undefined }
      );

      await approval.wait();

      setLoading(false);

      setNeedsApproval(false);
    } catch (e) {
      setLoading(false);
      setNeedsApproval(true);
      setError({
        status: true
      });
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

  function onMax() {
    setQty(finalAmount);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);
  }

  async function previewRepayAtMaturity() {
    if (!accountData || !symbol) return;

    const decimals = accountData[symbol].decimals;

    const market = fixedLenderWithSigner?.address;
    const parsedMaturity = parseInt(maturity);
    const parsedQtyValue = ethers.utils.parseUnits(qty, decimals);

    const earlyRepayAmount = await previewerContract?.previewRepayAtMaturity(
      market,
      parsedMaturity,
      parsedQtyValue,
      walletAddress
    );

    const formatRepayAmount = ethers.utils.formatUnits(earlyRepayAmount, decimals);

    const maximumRepayAmount = parseFloat(formatRepayAmount) * (1 + numbers.slippage);

    setRepayAmount(formatRepayAmount);
    setSlippage(formatNumber(maximumRepayAmount, symbol!, true));
  }

  async function repay() {
    setLoading(true);

    try {
      if (!accountData || !symbol) return;

      const decimals = accountData[symbol].decimals;

      let repay;

      if (symbol == 'WETH') {
        if (!web3Provider) return;

        const ETHrouter = handleEth(network?.name, web3Provider?.getSigner());

        repay = await ETHrouter?.repayAtMaturityETH(maturity, qty!);
      } else {
        const gasLimit = await getGasLimit(qty, qty);

        repay = await fixedLenderWithSigner?.repayAtMaturity(
          maturity,
          parseFixed(qty, decimals),
          parseFixed(qty, decimals),
          walletAddress,
          {
            gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * 1.1) : undefined
          }
        );
      }

      setTx({ status: 'processing', hash: repay?.hash });

      const txReceipt = await repay.wait();

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

      const gasLimit = await getGasLimit('1', '2');

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

  async function getGasLimit(qty: string, maxQty: string) {
    if (!accountData || !symbol) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.repayAtMaturity(
      maturity,
      parseFixed(qty, decimals),
      parseFixed(maxQty, decimals),
      walletAddress
    );

    return gasLimit;
  }

  async function getApprovalGasLimit() {
    const gasLimit = await underlyingContract?.estimateGas.approve(
      fixedLenderWithSigner?.address,
      ethers.constants.MaxUint256
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

  return (
    <>
      {!minimized && (
        <ModalWrapper closeModal={closeModal}>
          {!tx && (
            <>
              <ModalTitle
                title={isLateRepay ? translations[lang].lateRepay : translations[lang].earlyRepay}
              />
              <ModalAsset asset={symbol!} amount={finalAmount} />
              <ModalRow text={translations[lang].maturityPool} value={parseTimestamp(maturity)} />
              <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol!} />
              {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
              <ModalRow
                text={translations[lang].amountAtFinish}
                value={formatNumber(finalAmount, symbol!)}
              />
              <ModalExpansionPanelWrapper>
                <ModalRow text={translations[lang].amountToPay} value={repayAmount} line />

                <ModalRowEditable
                  text={translations[lang].maximumAmountToPay}
                  value={slippage}
                  editable={editSlippage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setSlippage(e.target.value);
                    error?.message == translations[lang].notEnoughSlippage && setError(undefined);
                  }}
                  onClick={() => {
                    if (slippage == '') setSlippage(parsedAmount);
                    setEditSlippage((prev) => !prev);
                  }}
                  line
                />

                {symbol ? (
                  <ModalRowHealthFactor
                    qty={qty}
                    symbol={symbol}
                    operation="repay"
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
                  operation="repay"
                />
              </ModalExpansionPanelWrapper>

              {error && error.component != 'gas' && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={needsApproval ? translations[lang].approval : translations[lang].repay}
                  className={parseFloat(qty) <= 0 || !qty ? 'secondaryDisabled' : 'quaternary'}
                  disabled={parseFloat(qty) <= 0 || !qty || loading}
                  onClick={needsApproval ? approve : repay}
                  loading={loading}
                  color="secondary"
                />
              </div>
            </>
          )}
          {tx && <ModalGif tx={tx} tryAgain={repay} />}
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

export default RepayModal;
