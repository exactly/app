import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
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
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Error } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';
import { getSymbol } from 'utils/utils';
import handleEth from 'utils/handleEth';

import decimals from 'config/decimals.json';
import numbers from 'config/numbers.json';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  closeModal: (props: any) => void;
};

function WithdrawModalSP({ data, closeModal }: Props) {
  const { symbol, assets } = data;

  const { walletAddress, web3Provider, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string>('');
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<Boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);
  const [collateralFactor, setCollateralFactor] = useState<number | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const parsedAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);

  const formattedAmount = formatNumber(parsedAmount, symbol!);

  const ETHrouter =
    web3Provider && symbol == 'WETH' && handleEth(network?.name, web3Provider?.getSigner());

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    checkAllowance();
  }, [walletAddress, fixedLenderWithSigner, symbol, qty]);

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
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
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
  }

  async function withdraw() {
    setLoading(true);

    try {
      let decimals;
      let withdraw;

      if (symbol == 'WETH') {
        if (!ETHrouter) return;

        decimals = 18;

        withdraw = await ETHrouter.withdrawETH(qty);
      } else {
        decimals = await fixedLenderWithSigner?.decimals();

        withdraw = await fixedLenderWithSigner?.withdraw(
          ethers.utils.parseUnits(qty!, decimals),
          walletAddress,
          walletAddress
        );
      }

      setTx({ status: 'processing', hash: withdraw?.hash });

      const status = await withdraw.wait();
      setLoading(false);

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e: any) {
      setLoading(false);

      const isDenied = e?.message?.includes('User denied');

      setError({
        status: true,
        message: isDenied && translations[lang].deniedTransaction
      });
    }
  }

  async function estimateGas() {
    if (symbol == 'WETH') return;

    try {
      const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();
      const decimals = await fixedLenderWithSigner?.decimals();
      const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.withdraw(
        ethers.utils.parseUnits(`${numbers.estimateGasAmount}`, decimals),
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
        component: 'gas'
      });
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
              <ModalRow text={translations[lang].exactlyBalance} value={formattedAmount} line />
              {symbol ? (
                <ModalRowHealthFactor
                  qty={qty}
                  symbol={symbol}
                  operation="withdraw"
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
                operation="withdraw"
              />
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
