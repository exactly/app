import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { type Address as AddressType, getAddress } from 'viem';
import { mainnet, optimism } from 'viem/chains';
import { OperationContextProvider, useOperationContext } from '../../contexts/OperationContext';
import { SocketSwapProvider, useSocketSwap } from '../../contexts/SocketSwapContext';
import { useWeb3 } from '../../hooks/useWeb3';
import useAccountData from '../../hooks/useAccountData';
import useDashboard from '../../hooks/useDashboard';
import i18n from '../../i18n';
import Welcome from './Welcome';
import Apps from './Apps';
import Address from './Address';
import Connect from './Connect';
import Collateral from './Collateral';
import Deposit from './Deposit';
import Borrow from './Borrow';
import Swap from './Swap';
import Success from './Success';

export type DepositConfig = {
  chainId: number;
  tokenAddress: AddressType;
  tokenSymbol: string;
  decimals: number;
};

const NATIVE_USDC_OP_MAINNET = {
  chainId: optimism.id,
  tokenAddress: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
  tokenSymbol: 'USDC',
  decimals: 6,
} as const satisfies DepositConfig;

const BRIDGED_USDC_OP_MAINNET = {
  chainId: optimism.id,
  tokenAddress: getAddress('0x7F5c764cBc14f9669B88837ca1490cCa17c31607'),
  tokenSymbol: 'USDC.e',
  decimals: 6,
} as const satisfies DepositConfig;

const USDT_OP_MAINNET = {
  chainId: optimism.id,
  tokenAddress: getAddress('0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'),
  tokenSymbol: 'USDT',
  decimals: 6,
} as const satisfies DepositConfig;

const USDC_MAINNET = {
  chainId: mainnet.id,
  tokenAddress: getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  tokenSymbol: 'USDC',
  decimals: 6,
} as const satisfies DepositConfig;

export const apps = () => [
  {
    name: 'Belo',
    imgURL: '/img/debit2credit/belo.svg',
    link: 'https://app.adjust.com/11d2v0px?label=https://simple.belo.app/app/referral',
    steps: [
      i18n.t('Select Receive -> Cryptocurrencies'),
      i18n.t('Select Tether USD -> Optimism'),
      i18n.t('Copy address and paste it below'),
    ],
    finishInstructions:
      'Now wait ~10 min to receive your funds. Remember to have USDT enabled in your payments profile going to My Cards -> More Options -> Payment Profile',
    depositConfig: USDT_OP_MAINNET,
  },
  {
    name: 'Binance',
    imgURL: '/img/debit2credit/binance.svg',
    link: 'https://app.binance.com',
    steps: [
      i18n.t('Select Deposit -> Deposit Crypto'),
      i18n.t('Select USDC -> Optimism'),
      i18n.t('Copy address and paste it below'),
    ],
    finishInstructions: 'All done! Now wait a bit to receive the funds.',
    depositConfig: NATIVE_USDC_OP_MAINNET,
  },
  {
    name: 'Bitso',
    imgURL: '/img/debit2credit/bitso.svg',
    link: 'https://bit.so/organicar',
    steps: [
      i18n.t('Tap "Deposit"'),
      i18n.t('Select Crypto -> USD stablecoins'),
      i18n.t('Choose USD Coin'),
      i18n.t('Copy address and paste it below'),
    ],
    finishInstructions:
      'Transaction pending, in short you will receive the funds. Remember to have USDC set as payment currency. Do this by going to the "Card" tab -> Pay with other currencies and select USDC for main or backup currency',
    depositConfig: USDC_MAINNET,
  },
  {
    name: 'Coinbase',
    imgURL: '/img/debit2credit/coinbase.svg',
    link: 'https://coinbase.com',
    steps: [
      i18n.t('Tap on "Receive"'),
      i18n.t(
        'Copy your Ethereum address - this is also your Optimism address - by tapping the copy button or the QR code',
      ),
    ],
    finishInstructions: 'All done! Now wait a bit to receive the funds.',
    depositConfig: NATIVE_USDC_OP_MAINNET,
  },
  {
    name: 'Lemon',
    imgURL: '/img/debit2credit/lemon.svg',
    link: 'https://www.lemon.me/app',
    steps: [
      i18n.t('Select Deposit -> Cryptocurrencies'),
      i18n.t('Select USDC -> Optimism'),
      i18n.t('Copy address and paste it below'),
    ],
    finishInstructions:
      'Transaction pending, in short you will receive the funds. Remember to have USDC set as payment currency. Do this by going to the "Card" tab -> Pay with other currencies and select USDC for main or backup currency',
    depositConfig: BRIDGED_USDC_OP_MAINNET,
  },
  {
    name: 'Ripio',
    imgURL: '/img/debit2credit/ripio.svg',
    link: 'https://auth.ripio.com',
    steps: [i18n.t('Go to "Wallet" Tab'), i18n.t('Select USDC'), i18n.t('Receive -> Optimism'), i18n.t('Copy address')],
    finishInstructions:
      'All done! Now wait a bit to receive the funds. Remember to set USDT as payment currency on Products -> Ripio Card',
    depositConfig: NATIVE_USDC_OP_MAINNET,
  },
  {
    name: 'Xapo',
    imgURL: '/img/debit2credit/xapo.svg',
    link: 'https://app.xapobank.com',
    steps: [
      i18n.t('Tap "Receive"'),
      i18n.t('Select USD Coin on Ethereum'),
      i18n.t('Scroll to bottom and tap on "Copy", then paste it here'),
    ],
    finishInstructions:
      'Transaction pending, in short you will receive the funds. Remember to have USDC set as payment currency. Do this by going to the "Card" tab -> Pay with other currencies and select USDC for main or backup currency',
    depositConfig: USDC_MAINNET,
  },
];

export type App = ReturnType<typeof apps>[number];

export enum Step {
  WELCOME = 'WELCOME',
  APPS = 'APPS',
  ADDRESS = 'ADDRESS',
  CONNECT = 'CONNECT',
  COLLATERAL = 'COLLATERAL',
  DEPOSIT = 'DEPOSIT',
  BORROW = 'BORROW',
  SWAP = 'SWAP',
  STATUS = 'STATUS',
}

const Credit = () => {
  const [step, setStep] = useState<Step>(Step.WELCOME);
  const [appIndex, setAppIndex] = useState<number>(0);
  const { isConnected, chain } = useWeb3();
  const { symbol, qty } = useOperationContext();
  const { marketAccount } = useAccountData(symbol);
  const { getMarketAccount } = useAccountData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    recipient: receiver,
    setRecipient: setReceiver,
    setToChainId,
    setToAssetAddress,
    setFromAssetAddress,
    setQtyIn,
  } = useSocketSwap();
  const { floatingRows } = useDashboard('deposit');
  const deposits = useMemo(() => floatingRows.filter(({ valueUSD }) => valueUSD !== 0), [floatingRows]);
  const hasCollateral = useMemo(
    () => deposits.some((row) => getMarketAccount(row.symbol)?.isCollateral),
    [getMarketAccount, deposits],
  );
  const app = apps()[appIndex];
  const direct = app.depositConfig.chainId === chain.id && app.depositConfig.tokenAddress === marketAccount?.asset;

  useEffect(() => {
    setFromAssetAddress(marketAccount?.asset);
    setQtyIn(qty);
  }, [marketAccount, qty, setFromAssetAddress, setQtyIn]);

  const handleConnectedNextStep = useCallback(() => {
    if (hasCollateral) {
      setStep(Step.BORROW);
    } else if (deposits.length !== 0) {
      setStep(Step.COLLATERAL);
    } else {
      setStep(Step.DEPOSIT);
    }
  }, [deposits.length, hasCollateral]);

  const handleNextStep = useCallback(() => {
    switch (step) {
      case Step.WELCOME:
        setStep(Step.APPS);
        break;
      case Step.APPS:
        setStep(Step.ADDRESS);
        break;
      case Step.ADDRESS:
        if (isConnected) handleConnectedNextStep();
        else setStep(Step.CONNECT);
        break;
      case Step.CONNECT:
        handleConnectedNextStep();
        break;
      case Step.COLLATERAL:
        setStep(Step.BORROW);
        break;
      case Step.DEPOSIT:
        if (hasCollateral) setStep(Step.BORROW);
        else setStep(Step.COLLATERAL);
        break;
      case Step.BORROW:
        if (direct) setStep(Step.STATUS);
        else setStep(Step.SWAP);
        break;
    }
  }, [direct, handleConnectedNextStep, hasCollateral, isConnected, step]);

  const handleAppChange = useCallback(
    (index: number) => {
      const {
        depositConfig: { chainId, tokenAddress },
      } = apps()[index];
      setAppIndex(index);
      setToChainId(chainId);
      setToAssetAddress(tokenAddress);
    },
    [setToAssetAddress, setToChainId],
  );

  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      mx="auto"
      maxWidth="100%"
      flex={1}
      my={4}
      {...(isMobile
        ? { width: '100%', height: '100%' }
        : {
            width: 500,
            minHeight: 500,
            p: 2,
            pt: 3,
          })}
    >
      {
        {
          [Step.WELCOME]: <Welcome onNextStep={handleNextStep} />,
          [Step.APPS]: <Apps onNextStep={handleNextStep} onChange={handleAppChange} />,
          [Step.ADDRESS]: <Address onNextStep={handleNextStep} onChange={setReceiver} value={receiver} app={app} />,
          [Step.CONNECT]: <Connect onNextStep={handleNextStep} />,
          [Step.COLLATERAL]: (
            <Collateral onNextStep={handleNextStep} deposits={deposits} hasCollateral={hasCollateral} />
          ),
          [Step.DEPOSIT]: <Deposit onNextStep={handleNextStep} />,
          [Step.BORROW]: (
            <Borrow
              onNextStep={handleNextStep}
              onDeposit={() => setStep(Step.DEPOSIT)}
              direct={direct}
              receiver={receiver}
              depositConfig={app.depositConfig}
            />
          ),
          [Step.STATUS]: <Success app={app} />,
          [Step.SWAP]: <Swap onNextStep={handleNextStep} />,
        }[step]
      }
    </Box>
  );
};

const CreditWrapper = () => {
  return (
    <SocketSwapProvider>
      <OperationContextProvider
        args={{
          operation: 'borrowAtMaturity',
          symbol: 'USDC',
        }}
      >
        <Credit />
      </OperationContextProvider>
    </SocketSwapProvider>
  );
};

export default CreditWrapper;
