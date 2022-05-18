import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalClose from 'components/common/modal/ModalClose';
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

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { HealthFactor } from 'types/HealthFactor';
import { Error } from 'types/Error';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';
import AuditorContext from 'contexts/AuditorContext';

import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function WithdrawModalSP({ data, closeModal }: Props) {
  const { symbol, assets } = data;

  const { walletAddress, web3Provider } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);
  const auditorData = useContext(AuditorContext);

  const [qty, setQty] = useState<string>('');
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<Boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor>();
  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const previewerContract = getContractData(previewerData.address!, previewerData.abi!);

  const parsedAmount = formatNumber(
    ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]),
    symbol!
  );

  useEffect(() => {
    getFixedLenderContract();
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    getHealthFactor();
  }, [walletAddress]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  async function getHealthFactor() {
    try {
      const accountLiquidity = await previewerContract?.accountLiquidity(
        auditorData.address,
        walletAddress
      );

      const collateral = parseFloat(ethers.utils.formatEther(accountLiquidity[0]));
      const debt = parseFloat(ethers.utils.formatEther(accountLiquidity[1]));

      setHealthFactor({ debt, collateral });
    } catch (e) {
      console.log(e);
    }
  }

  function onMax() {
    setQty(parsedAmount);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.valueAsNumber > parseFloat(qty)) {
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
      const withdraw = await fixedLenderWithSigner?.withdraw(
        ethers.utils.parseUnits(qty!),
        walletAddress,
        walletAddress
      );
      setTx({ status: 'processing', hash: withdraw?.hash });

      const status = await withdraw.wait();
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

      const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.withdraw(
        ethers.utils.parseUnits(`${numbers.estimateGasAmount}`),
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
      setError({
        status: true,
        message: translations[lang].notEnoughBalance,
        component: 'gas'
      });
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
              {error?.component !== 'gas' && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].exactlyBalance} value={parsedAmount} line />
              {healthFactor && symbol ? (
                <ModalRowHealthFactor
                  healthFactor={healthFactor}
                  qty={qty}
                  symbol={symbol}
                  operation="withdraw"
                />
              ) : (
                <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
              )}
              {error && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={translations[lang].withdraw}
                  className={qty <= '0' || !qty || error?.status ? 'secondaryDisabled' : 'tertiary'}
                  disabled={qty <= '0' || !qty || loading || error?.status}
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

export default WithdrawModalSP;
