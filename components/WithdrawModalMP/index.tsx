import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalClose from 'components/common/modal/ModalClose';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalMinimized from 'components/common/modal/ModalMinimized';
import ModalWrapper from 'components/common/modal/ModalWrapper';
import ModalGif from 'components/common/modal/ModalGif';
import Overlay from 'components/Overlay';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';

import parseTimestamp from 'utils/parseTimestamp';
import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import PreviewerContext from 'contexts/PreviewerContext';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function WithdrawModalMP({ data, closeModal }: Props) {
  const { symbol, maturity, assets, fee } = data;

  const { web3Provider, walletAddress } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);

  const parsedFee = ethers.utils.formatUnits(fee, decimals[symbol! as keyof Decimals]);
  const parsedAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);
  const finalAmount = (parseFloat(parsedAmount) + parseFloat(parsedFee)).toString();

  const [qty, setQty] = useState<string>('');
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<Boolean>(false);
  const [slippage, setSlippage] = useState<string>(parsedAmount);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEarlyWithdraw, setIsEarlyWithdraw] = useState<boolean>(false);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const previewerContract = getContractData(previewerData.address!, previewerData.abi!);

  useEffect(() => {
    getFixedLenderContract();
  }, []);

  useEffect(() => {
    const earlyWithdraw = Date.now() / 1000 < parseInt(maturity);

    if (earlyWithdraw) {
      setIsEarlyWithdraw(earlyWithdraw);
    }

    if (!earlyWithdraw) {
      //if the maturity is closed the user should be able to withdraw everything.
      // so slippage = finalAmount

      setSlippage(finalAmount);
    }
  }, [maturity]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  function onMax() {
    const formattedAmount = formatNumber(finalAmount, symbol!);

    setQty(formattedAmount);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);
  }

  async function withdraw() {
    setLoading(true);

    try {
      //we should change this 0 in case of earlyWithdraw with the amount - penaltyFee from the previewWithdraw

      const minAmount = isEarlyWithdraw ? 0 : finalAmount;

      const withdraw = await fixedLenderWithSigner?.withdrawAtMaturity(
        maturity,
        ethers.utils.parseUnits(qty!),
        ethers.utils.parseUnits(`${minAmount}`),
        walletAddress,
        walletAddress
      );

      setTx({ status: 'processing', hash: withdraw?.hash });

      const status = await withdraw.wait();
      setLoading(false);

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      setLoading(false);
      console.log(e);
    }
  }

  async function estimateGas() {
    const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

    const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.withdrawAtMaturity(
      maturity,
      ethers.utils.parseUnits(`${numbers.estimateGasAmount}`),
      ethers.utils.parseUnits('0'),
      walletAddress,
      walletAddress
    );

    if (gasPriceInGwei && estimatedGasCost) {
      const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
      const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
      const eth = parseFloat(gwei) * parseFloat(gasCost);

      setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
    }
  }

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      const args: Array<string> | undefined = contract?.args;
      const contractSymbol: string | undefined = args && args[1];

      return contractSymbol == symbol;
    });

    const fixedLender = await getContractData(
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      web3Provider?.getSigner()
    );

    setFixedLenderWithSigner(fixedLender);
  }

  return (
    <>
      {!minimized && (
        <ModalWrapper>
          {!tx && (
            <>
              <ModalTitle
                title={
                  isEarlyWithdraw ? translations[lang].earlyWithdraw : translations[lang].withdraw
                }
              />
              <ModalAsset asset={symbol!} amount={finalAmount} />
              <ModalClose closeModal={closeModal} />
              <ModalRow text={translations[lang].maturityPool} value={parseTimestamp(maturity)} />
              <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol!} />
              <ModalTxCost gas={gas} />
              <ModalRow
                text={translations[lang].amountAtFinish}
                value={formatNumber(finalAmount, symbol!)}
                line
              />
              <ModalRow
                text={translations[lang].amountToReceive}
                value={
                  isEarlyWithdraw
                    ? formatNumber(qty || 0, symbol!)
                    : formatNumber(finalAmount, symbol!)
                }
                line
              />
              {isEarlyWithdraw && (
                <ModalRowEditable
                  text={translations[lang].amountSlippage}
                  value={slippage}
                  editable={editSlippage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setSlippage(e.target.value);
                  }}
                  onClick={() => {
                    if (slippage == '') setSlippage(parsedAmount);
                    setEditSlippage((prev) => !prev);
                  }}
                  line
                />
              )}
              <div className={styles.buttonContainer}>
                <Button
                  text={translations[lang].withdraw}
                  className={qty <= '0' || !qty ? 'secondaryDisabled' : 'tertiary'}
                  disabled={qty <= '0' || !qty || loading}
                  onClick={withdraw}
                  loading={loading}
                  color="primary"
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

export default WithdrawModalMP;
