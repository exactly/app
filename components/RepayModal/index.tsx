import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalClose from 'components/common/modal/ModalClose';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalMinimized from 'components/common/modal/ModalMinimized';
import ModalWrapper from 'components/common/modal/ModalWrapper';
import ModalGif from 'components/common/modal/ModalGif';
import Overlay from 'components/Overlay';

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

import decimals from 'config/decimals.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function RepayModal({ data, closeModal }: Props) {
  const { symbol, maturity, assets, fee } = data;
  const { walletAddress, web3Provider } = useWeb3Context();

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
  const [minimized, setMinimized] = useState<boolean>(false);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  useEffect(() => {
    getFixedLenderContract();
  }, []);

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
    getFixedLenderContract();
  }, []);

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

  function onMax() {
    const formattedAmount = formatNumber(finalAmount, symbol!);
    setQty(formattedAmount);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);
  }

  async function repay() {
    setLoading(true);

    try {
      const repay = await fixedLenderWithSigner?.repayAtMaturity(
        maturity,
        ethers.utils.parseUnits(qty!),
        ethers.utils.parseUnits(qty!),
        walletAddress
      );

      setTx({ status: 'processing', hash: repay?.hash });

      const status = await repay.wait();

      setLoading(false);

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      setLoading(false);
      console.log(e);
    }
  }

  async function estimateGas() {
    const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

    const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.repayAtMaturity(
      maturity,
      ethers.utils.parseUnits('1'),
      ethers.utils.parseUnits('2'),
      walletAddress
    );

    if (gasPriceInGwei && estimatedGasCost) {
      const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
      const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
      const eth = parseFloat(gwei) * parseFloat(gasCost);

      setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
    }
  }

  return (
    <>
      {!minimized && (
        <ModalWrapper>
          {!tx && (
            <>
              <ModalTitle
                title={isLateRepay ? translations[lang].lateRepay : translations[lang].earlyRepay}
              />
              <ModalAsset asset={symbol!} amount={finalAmount} />
              <ModalClose closeModal={closeModal} />
              <ModalRow text={translations[lang].maturityPool} value={parseTimestamp(maturity)} />
              <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} />
              {gas && <ModalTxCost gas={gas} />}
              <ModalRow
                text={translations[lang].amountAtFinish}
                value={formatNumber(finalAmount, symbol!)}
                line
              />
              <ModalRow
                text={translations[lang].amountToPay}
                value={formatNumber(finalAmount, symbol!)}
                line
              />
              <ModalRowEditable
                text={translations[lang].maximumAmountToPay}
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
              <ModalRow text={translations[lang].healthFactor} values={['1.1', '1.8']} />
              <div className={styles.buttonContainer}>
                <Button
                  text={translations[lang].repay}
                  className={qty <= '0' || !qty ? 'secondaryDisabled' : 'quaternary'}
                  disabled={qty <= '0' || !qty || loading}
                  onClick={repay}
                  loading={loading}
                  color="secondary"
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

export default RepayModal;
