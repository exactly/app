import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
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

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Error } from 'types/Error';
import { UnderlyingData } from 'types/Underlying';

import { getContractData } from 'utils/contracts';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import handleEth from 'utils/handleEth';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function FloatingRepayModal({ data, closeModal }: Props) {
  const { symbol, assets } = data;

  const { walletAddress, web3Provider, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const { minimized, setMinimized } = useContext(ModalStatusContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const finalAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);
  const [qty, setQty] = useState<string>('');

  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  // const [repayAmount, setRepayAmount] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

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

  async function repay() {
    if (!accountData) return;
    setLoading(true);

    try {
      const decimals = accountData[symbol!].decimals;

      let repay;

      if (symbol == 'WETH') {
        if (!web3Provider) return;

        const ETHrouter = handleEth(network?.name, web3Provider?.getSigner());

        repay = await ETHrouter?.repayETH(qty!);
      } else {
        const gasLimit = await getGasLimit(qty);

        repay = await fixedLenderWithSigner?.repay(
          ethers.utils.parseUnits(qty!, decimals),
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
    if (symbol == 'WETH' || !accountData) return;

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

    const gasLimit = await fixedLenderWithSigner?.estimateGas.repay(
      ethers.utils.parseUnits(qty, decimals),
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
      {!minimized && (
        <ModalWrapper closeModal={closeModal}>
          {!tx && (
            <>
              <ModalTitle title={translations[lang].lateRepay} />
              <ModalAsset asset={symbol!} amount={finalAmount} />
              <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol!} />
              {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}

              {/* <ModalExpansionPanelWrapper> */}
              {/* <ModalRow text={translations[lang].amountToPay} value={repayAmount} line /> */}

              {symbol ? (
                <ModalRowHealthFactor qty={qty} symbol={symbol} operation="repay" />
              ) : (
                <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
              )}
              <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="repay" />
              {/* </ModalExpansionPanelWrapper> */}

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

export default FloatingRepayModal;
