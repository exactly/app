import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers, BigNumber } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';
import ModalExpansionPanelWrapper from 'components/common/modal/ModalExpansionPanelWrapper';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';

import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Error } from 'types/Error';
import { UnderlyingData } from 'types/Underlying';

import formatNumber from 'utils/formatNumber';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import handleEth from 'utils/handleEth';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';
import PreviewerContext from 'contexts/PreviewerContext';
import { MarketContext } from 'contexts/AddressContext';
import ContractsContext from 'contexts/ContractsContext';

import numbers from 'config/numbers.json';

import keys from './translations.json';

function RepayAtMaturity() {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);
  const { getInstance } = useContext(ContractsContext);

  const previewerData = useContext(PreviewerContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [isLateRepay, setIsLateRepay] = useState<boolean>(
    Date.now() / 1000 > parseInt(date!.value)
  );

  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [repayAmount, setRepayAmount] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [amountAtFinish, setAmountAtFinish] = useState<string | undefined>(undefined);
  const [penaltyAssets, setPenaltyAssets] = useState<string>('0');
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [slippage, setSlippage] = useState<string>('0');
  const [error, setError] = useState<Error | undefined>(undefined);
  const [positionAssets, setPositionAssets] = useState<BigNumber | bigint>(0n);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );
  const [underlyingContract, setUnderlyingContract] = useState<Contract | undefined>(undefined);

  const symbol = getSymbol(market!.value, network?.name);

  const debounceQty = useDebounce(qty);

  useEffect(() => {
    getFixedLenderContract();
  }, [market, fixedLenderData, symbol]);

  useEffect(() => {
    getUnderlyingContract();
  }, [market, network, symbol]);

  useEffect(() => {
    setPositionAssets(0n);

    const pool = accountData![symbol].fixedDepositPositions.find((position) => {
      return position.maturity.toNumber().toString() === date!.value;
    });
    const positionAssets = pool ? pool.position.principal.add(pool.position.fee) : 0n;

    setPositionAssets(positionAssets);
  }, [date, accountData, symbol]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  useEffect(() => {
    const repay = Date.now() / 1000 > parseInt(date!.value);

    setIsLateRepay(repay);
  }, [date]);

  useEffect(() => {
    previewRepayAtMaturity();
    if (isLateRepay) calculatePenalties();
  }, [debounceQty]);

  useEffect(() => {
    checkAllowance();
  }, [symbol, walletAddress, underlyingContract]);

  useEffect(() => {
    calculateAmount();
  }, [accountData, symbol, positionAssets]);

  function calculateAmount() {
    if (!accountData || !symbol) return;

    const decimals = accountData[symbol.toUpperCase()].decimals;

    setAmountAtFinish(formatFixed(positionAssets, decimals));
  }

  function calculatePenalties() {
    if (!accountData || !symbol || !date) return;

    if (qty == '') {
      setPenaltyAssets('0');
      setTotalAmount('0');
      return;
    }

    const decimals = accountData[symbol.toUpperCase()].decimals;
    const positionAssets = parseFixed(qty, decimals);
    const penaltyRate = accountData[symbol.toUpperCase()].penaltyRate;
    const WAD = parseFixed('1', 18);

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const maturityTimestamp = parseFloat(date.value);
    const penaltyTime = currentTimestamp - maturityTimestamp;

    const penaltyAssets = penaltyRate.mul(penaltyTime).mul(positionAssets).div(WAD);

    setPenaltyAssets(Number(formatFixed(penaltyAssets, decimals)).toFixed(decimals));
    setTotalAmount(
      Number(formatFixed(positionAssets.add(penaltyAssets), decimals)).toFixed(decimals)
    );
  }

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
        {
          gasLimit: gasLimit
            ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier)
            : undefined
        }
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

  function getUnderlyingContract() {
    const underlyingData: UnderlyingData | undefined = getUnderlyingData(
      network?.name,
      symbol.toLowerCase()
    );

    const underlyingContract = getInstance(
      underlyingData!.address,
      underlyingData!.abi,
      `underlying${symbol}`
    );

    setUnderlyingContract(underlyingContract);
  }

  function onMax() {
    //**** This code is if the Max button has to take you to your debt with penalties on late repays */
    // let finalAssets = positionAssets;
    // if (isLateRepay) {
    //   const penaltyAssets = calculatePenalties();
    //   finalAssets = finalAssets.add(penaltyAssets || ethers.constants.Zero);
    // }

    const decimals = accountData![symbol!.toUpperCase()].decimals;
    setQty(formatFixed(positionAssets, decimals));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (!accountData || !symbol) return;
    const decimals = accountData[symbol.toUpperCase()].decimals;

    if (e.target.value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(e.target.value)![0];
      if (inputDecimals.length > decimals) return;
    }
    setQty(e.target.value);
  }

  async function previewRepayAtMaturity() {
    if (!accountData || !symbol || !date) return;

    if (qty == '') {
      setRepayAmount('0');
      return;
    }

    const decimals = accountData[symbol].decimals;

    const market = fixedLenderWithSigner?.address;
    const parsedMaturity = parseInt(date.value);
    const parsedQtyValue = ethers.utils.parseUnits(qty, decimals);
    const WAD = parseFixed('1', 18);

    const previewerContract = getInstance(previewerData.address!, previewerData.abi!, 'previewer');

    const repayAmount = await previewerContract?.previewRepayAtMaturity(
      market,
      parsedMaturity,
      parsedQtyValue,
      walletAddress
    );

    const parseSlippage = parseFixed((1 + numbers.slippage).toString(), 18);

    const maximumRepayAmount = repayAmount.mul(parseSlippage).div(WAD);

    setRepayAmount(Number(formatFixed(repayAmount, decimals)).toFixed(decimals));
    setSlippage(formatFixed(maximumRepayAmount, decimals)); // = principal + fee + penalties if is late repay + slippage
  }

  async function repay() {
    setLoading(true);

    try {
      if (!accountData || !symbol || !date) return;

      const decimals = accountData[symbol].decimals;

      let repay;

      if (symbol == 'WETH') {
        if (!web3Provider) return;

        const ETHrouter = handleEth(network?.name, web3Provider?.getSigner());

        repay = await ETHrouter?.repayAtMaturityETH(date.value, qty!, slippage);
      } else {
        const gasLimit = await getGasLimit(qty, slippage);

        repay = await fixedLenderWithSigner?.repayAtMaturity(
          date.value,
          ethers.utils.parseUnits(qty, decimals),
          ethers.utils.parseUnits(slippage, decimals),
          walletAddress,
          {
            gasLimit: gasLimit
              ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier)
              : undefined
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
    if (!accountData || !symbol || !date) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.repayAtMaturity(
      date.value,
      ethers.utils.parseUnits(qty, decimals),
      ethers.utils.parseUnits(maxQty, decimals),
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

  return (
    <>
      {!tx && (
        <>
          <ModalTitle
            title={isLateRepay ? translations[lang].lateRepay : translations[lang].earlyRepay}
          />
          <ModalAsset asset={symbol!} amount={amountAtFinish} />
          <ModalMaturityEditable text={translations[lang].maturityPool} />
          <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol!} />
          {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
          <ModalRow
            text={translations[lang].amountAtFinish}
            value={amountAtFinish && `${formatNumber(amountAtFinish, symbol!, true)}`}
            asset={symbol}
          />
          {isLateRepay ? (
            <>
              <ModalRow
                text={translations[lang].penalties}
                value={formatNumber(penaltyAssets, symbol!, true)}
                asset={symbol}
              />
              <ModalRow
                text={translations[lang].totalAssets}
                value={formatNumber(totalAmount, symbol!, true)}
                asset={symbol}
              />
            </>
          ) : (
            <ModalRow
              text={translations[lang].amountToPay}
              value={formatNumber(repayAmount, symbol!)}
              asset={symbol}
            />
          )}
          <ModalExpansionPanelWrapper>
            <ModalRowEditable
              text={translations[lang].maximumAmountToPay}
              value={formatNumber(slippage, symbol!)}
              editable={editSlippage}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSlippage(e.target.value);
                error?.message == translations[lang].notEnoughSlippage && setError(undefined);
              }}
              onClick={() => {
                if (slippage == '') setSlippage('0');
                setEditSlippage((prev) => !prev);
              }}
            />
            {symbol ? (
              <ModalRowHealthFactor qty={qty} symbol={symbol} operation="repay" />
            ) : (
              <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
            )}
            <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="repay" />
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
    </>
  );
}

export default RepayAtMaturity;
