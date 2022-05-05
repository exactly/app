import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';

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

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Dictionary } from 'types/Dictionary';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';
import AuditorContext from 'contexts/AuditorContext';

import { getContractData } from 'utils/contracts';
import parseHealthFactor from 'utils/parseHealthFactor';

import decimals from 'config/decimals.json';

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
  const [healthFactor, setHealthFactor] = useState<Dictionary<number>>();

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const previewerContract = getContractData(previewerData.address!, previewerData.abi!);

  const parsedAmount = ethers.utils.formatUnits(assets, decimals[symbol! as keyof Decimals]);

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
      console.log(e);
    }
  }

  async function estimateGas() {
    const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

    const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.withdraw(
      ethers.utils.parseUnits('1'),
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
              <ModalTitle title={translations[lang].withdraw} />
              <ModalAsset asset={symbol!} />
              <ModalClose closeModal={closeModal} />
              <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} />
              {gas && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].exactlyBalance} value={parsedAmount} line />
              {healthFactor && (
                <ModalRow
                  text={translations[lang].healthFactor}
                  values={[
                    parseHealthFactor(healthFactor.debt, healthFactor.collateral),
                    parseHealthFactor(
                      healthFactor.debt,
                      healthFactor.collateral - parseFloat(qty || '0')
                    )
                  ]}
                />
              )}
              <ModalRow text={translations[lang].borrowLimit} values={['1000', '2000']} />
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

export default WithdrawModalSP;
