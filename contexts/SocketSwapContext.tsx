import React, {
  useCallback,
  useEffect,
  createContext,
  useContext,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';

import { parseEther, parseUnits, zeroAddress, Address } from 'viem';
import * as wagmiChains from 'wagmi/chains';

import { useWalletClient } from 'wagmi';
import { optimism } from 'wagmi/chains';

import {
  type Route,
  type Chain,
  type DestinationCallData,
  type AssetBalance,
  NATIVE_TOKEN_ADDRESS,
  Protocol,
  ActiveRoute,
  BridgeStatus,
} from 'types/Bridge';
import handleOperationError from 'utils/handleOperationError';
import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import { useWeb3 } from 'hooks/useWeb3';
import {
  socketActiveRoutes,
  socketBridgeStatus,
  socketBuildTX,
  socketChains,
  socketQuote,
  socketRequest,
} from 'utils/socket';
import { useTranslation } from 'react-i18next';
import useERC20 from 'hooks/useERC20';
import { gasLimit } from 'utils/gas';
import waitForTransaction from 'utils/waitForTransaction';
import useDelayedEffect from 'hooks/useDelayedEffect';

export enum Screen {
  SELECT_ROUTE = 'SELECT_ROUTE',
  REVIEW_ROUTE = 'REVIEW',
  TX_STATUS = 'TX_STATUS',
}

export enum TXStep {
  APPROVE = 'APPROVE',
  APPROVE_PENDING = 'APPROVE_PENDING',
  CONFIRM = 'CONFIRM',
  CONFIRM_PENDING = 'CONFIRM_PENDING',
}

type SetProp<C, Key extends keyof C> = (value: C[Key]) => void;

type ContextValues = {
  qtyIn: string;
  txError?: ErrorData;
  socketError?: ErrorData;
  screen: Screen;
  chain?: Chain;
  fromAssetAddress?: Address;
  toAssetAddress?: Address;
  chains?: Chain[];
  routes?: Route[];
  destinationCallData?: DestinationCallData;
  route?: Route | null;
  tx?: Transaction;
  qtyOut?: bigint;
  txStep: TXStep;
  protocol?: Protocol;
  qtyOutUSD?: bigint;
  activeRoutes?: ActiveRoute[];
  bridgeStatus?: BridgeStatus;
  isBridge: boolean;
  recipient?: Address;
  toChainId?: number;
  setChain: SetProp<ContextValues, 'chain'>;
  setFromAssetAddress: SetProp<ContextValues, 'fromAssetAddress'>;
  setToAssetAddress: SetProp<ContextValues, 'toAssetAddress'>;
  setRoute: SetProp<ContextValues, 'route'>;
  setScreen: SetProp<ContextValues, 'screen'>;
  setQtyIn: SetProp<ContextValues, 'qtyIn'>;
  setTXStep: SetProp<ContextValues, 'txStep'>;
  setRecipient: SetProp<ContextValues, 'recipient'>;
  setToChainId: SetProp<ContextValues, 'toChainId'>;
  submit: () => void;
  approve: () => void;
};

const SocketSwapContext = createContext<ContextValues | null>(null);

export const SocketSwapProvider: FC<PropsWithChildren> = ({ children }) => {
  const [screen, setScreen] = useState<Screen>(Screen.SELECT_ROUTE);
  const [qtyIn, setQtyIn] = useState<string>('');
  const [txError, setTXError] = useState<ContextValues['txError']>();
  const [socketError, setSocketError] = useState<ContextValues['socketError']>();
  const [chain, setChain] = useState<ContextValues['chain']>();
  const [fromAssetAddress, setFromAssetAddress] = useState<ContextValues['fromAssetAddress']>();
  const [toAssetAddress, setToAssetAddress] = useState<ContextValues['toAssetAddress']>();
  const [chains, setChains] = useState<ContextValues['chains']>();
  const [routes, setRoutes] = useState<ContextValues['routes']>();
  const [route, setRoute] = useState<ContextValues['route']>();
  const [tx, setTX] = useState<ContextValues['tx']>();
  const [txStep, setTXStep] = useState<ContextValues['txStep']>(TXStep.APPROVE);
  const [activeRoutes, setActiveRoutes] = useState<ContextValues['activeRoutes']>();
  const [bridgeStatus, setBridgeStatus] = useState<ContextValues['bridgeStatus']>();
  const [recipient, setRecipient] = useState<ContextValues['recipient']>();
  const [toChainId, setToChainId] = useState<ContextValues['toChainId']>();

  const { walletAddress, opts, chain: appChain } = useWeb3();
  const { data: walletClient } = useWalletClient({ chainId: chain?.chainId });
  const { t } = useTranslation();
  const isBridge = chain?.chainId !== appChain.id;
  const erc20 = useERC20(fromAssetAddress === NATIVE_TOKEN_ADDRESS ? undefined : fromAssetAddress, chain?.chainId);

  const fetchChains = useCallback(async () => {
    const allChains = await socketChains();
    const assetsWithBalance = await socketRequest<Omit<AssetBalance, 'usdAmount'>[]>('balances', {
      userAddress: walletAddress || zeroAddress,
    });
    if (!assetsWithBalance || assetsWithBalance.length === 0) {
      setChains(allChains);
      return;
    }
    const usedChainIds = assetsWithBalance.map(({ chainId }) => chainId);
    setChains(allChains?.filter(({ chainId }) => usedChainIds.find((id) => id === chainId)));
  }, [setChains, walletAddress]);

  const fetchRoutes = useCallback(async () => {
    if (!fromAssetAddress || !toAssetAddress || !chain || !walletAddress || !toChainId) return;

    setRoutes(undefined);
    setSocketError(undefined);

    if (parseEther(qtyIn) === 0n) {
      return;
    }

    try {
      const fromAssetDecimals = (await erc20?.read.decimals()) || 18;

      const quote = await socketQuote({
        fromChainId: chain.chainId,
        toChainId: toChainId,
        fromTokenAddress: fromAssetAddress,
        fromAmount: parseUnits(qtyIn, fromAssetDecimals),
        userAddress: walletAddress || zeroAddress,
        toTokenAddress: toAssetAddress,
        recipient,
        destinationGasLimit: 100000000000000000000n,
      });

      setRoutes(quote?.routes || []);
      setRoute(quote?.routes[0]);
    } catch (e) {
      setRoutes([]);
      setRoute(undefined);
      setSocketError({ message: t('Error fetching routes from socket'), status: true });
    }
  }, [fromAssetAddress, toAssetAddress, chain, walletAddress, toChainId, qtyIn, erc20?.read, recipient, t]);

  const approve = useCallback(async () => {
    setTXError(undefined);
    if (fromAssetAddress === NATIVE_TOKEN_ADDRESS) setTXStep(TXStep.CONFIRM);

    if (!walletAddress || !walletClient || !route || !erc20 || !opts) return;

    const {
      userTxs: [{ approvalData }],
    } = route;

    const supportedChains = Object.values(wagmiChains);

    const crossChainOpts = {
      ...opts,
      chain: supportedChains.find((c) => c.id === chain?.chainId),
    };

    if (!approvalData) {
      setTXStep(TXStep.CONFIRM);
      return;
    }

    setTXStep(TXStep.APPROVE_PENDING);
    try {
      const allowance = await erc20.read.allowance([walletAddress, approvalData.allowanceTarget], crossChainOpts);

      const minimumApprovalAmount = BigInt(approvalData.minimumApprovalAmount);

      if (allowance < minimumApprovalAmount) {
        const args = [approvalData.allowanceTarget, minimumApprovalAmount] as const;
        const gas = await erc20.estimateGas.approve(args, opts);
        const hash = await erc20.write.approve(args, {
          ...crossChainOpts,
          gasLimit: gasLimit(gas),
        });
        await waitForTransaction({ hash });
      }
      setTXStep(TXStep.CONFIRM);
    } catch (err) {
      if (err instanceof Error) {
        setTXError({ status: true, message: handleOperationError(err) });
      }
      setTXStep(TXStep.APPROVE);
    }
  }, [chain?.chainId, erc20, fromAssetAddress, opts, route, walletAddress, walletClient]);

  const submit = useCallback(async () => {
    if (txStep !== TXStep.CONFIRM || !walletClient || !route) return;

    try {
      const { txTarget, txData, value } = await socketBuildTX({ route });
      setTXStep(TXStep.CONFIRM_PENDING);
      const txHash_ = await walletClient.sendTransaction({
        to: txTarget,
        data: txData,
        value: BigInt(value),
      });

      setTX({ status: 'processing', hash: txHash_ });
      const { status, transactionHash } = await waitForTransaction({ hash: txHash_ });
      setTX({ status: status ? 'success' : 'error', hash: transactionHash });
      setScreen(Screen.TX_STATUS);
    } catch (err) {
      setTXError({ status: true, message: handleOperationError(err) });
      setTXStep(TXStep.CONFIRM);
    }
  }, [route, txStep, walletClient]);

  useEffect(() => {
    if (!isBridge) return;
    if (bridgeStatus) {
      const { destinationTxStatus, sourceTxStatus } = bridgeStatus;
      const bridgeInProgess = sourceTxStatus === 'PENDING' || destinationTxStatus === 'PENDING';
      if (!bridgeInProgess) return;
    }
    const fetchBridgeStatus = async () => {
      if (!tx?.hash || !chain) return;
      try {
        const response = await socketBridgeStatus({
          transactionHash: tx.hash,
          fromChainId: chain.chainId,
          toChainId: optimism.id,
        });

        setBridgeStatus(response);
      } catch (err) {
        setSocketError({ status: true, message: handleOperationError(err) });
      }
    };
    const interval = setInterval(() => {
      fetchBridgeStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [isBridge, bridgeStatus, chain, tx?.hash]);

  const { isLoading: routesLoading } = useDelayedEffect({
    effect: fetchRoutes,
    delay: 1000,
  });

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  useEffect(() => {
    if (!chains) return;
    const id = optimism.id;
    const activeNetwork = chains.find(({ chainId }) => chainId === id);
    if (activeNetwork) setChain(activeNetwork);
  }, [chains, setChain]);

  const fetchActiveRoutes = useCallback(async () => {
    if (!walletAddress) return;
    const response = await socketActiveRoutes({ userAddress: walletAddress });
    setActiveRoutes(response.activeRoutes);
  }, [walletAddress]);

  useEffect(() => {
    fetchActiveRoutes();
  }, [fetchActiveRoutes]);

  const qtyOut = route ? BigInt(route.toAmount) : undefined;
  const qtyOutUSD = route ? BigInt(route.outputValueInUsd * 1e18) : undefined;

  const handleFromAssetAddressChange = useCallback((a: ContextValues['fromAssetAddress']) => {
    setFromAssetAddress(a);
    setQtyIn('');
  }, []);

  const value: ContextValues = {
    setScreen: (s: ContextValues['screen']) => {
      setScreen(s);
      if (s === Screen.REVIEW_ROUTE) {
        setTXStep(TXStep.CONFIRM);
      }
      if (s === Screen.SELECT_ROUTE) {
        setTXStep(TXStep.APPROVE);
        setTXError(undefined);
      }
    },
    setFromAssetAddress: handleFromAssetAddressChange,
    setChain,
    setQtyIn,
    setTXStep,
    approve,
    setRoute,
    submit,
    setToAssetAddress,
    screen,
    qtyIn,
    txError,
    socketError,
    chain,
    fromAssetAddress: fromAssetAddress,
    chains,
    routes,
    route: routesLoading ? undefined : route,
    tx,
    txStep,
    qtyOut,
    protocol:
      route?.userTxs?.[route?.userTxs.length - 1]?.protocol ||
      route?.userTxs?.[0].steps?.[(route.userTxs[0]?.stepCount || 0) - 1].protocol,
    qtyOutUSD,
    activeRoutes,
    bridgeStatus,
    isBridge,
    toChainId,
    toAssetAddress,
    recipient,
    setRecipient,
    setToChainId,
  };

  return <SocketSwapContext.Provider value={value}>{children}</SocketSwapContext.Provider>;
};

export const useSocketSwap = () => {
  const ctx = useContext(SocketSwapContext);
  if (!ctx) {
    throw new Error('Using SocketSwapContext outside of provider');
  }
  return ctx;
};

export default SocketSwapContext;
