import React, {
  useCallback,
  useEffect,
  createContext,
  useContext,
  useState,
  type FC,
  type PropsWithChildren,
  useMemo,
} from 'react';

import {
  type Hash,
  Hex,
  encodeFunctionData,
  parseEther,
  parseUnits,
  zeroAddress,
  hexToBigInt,
  keccak256,
  encodeAbiParameters,
} from 'viem';
import * as wagmiChains from 'wagmi/chains';

import { useSignTypedData, useWalletClient } from 'wagmi';
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
import useSocketAssets from 'hooks/useSocketAssets';
import handleOperationError from 'utils/handleOperationError';
import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import { swapperABI } from 'types/abi';
import { useEXAETHPrice, useEXAPrice } from 'hooks/useEXA';
import { useWeb3 } from 'hooks/useWeb3';
import {
  socketActiveRoutes,
  socketBridgeStatus,
  socketBuildTX,
  socketChains,
  socketQuote,
  socketRequest,
} from 'utils/socket';
import { useSwapper } from 'hooks/useSwapper';
import { useTranslation } from 'react-i18next';
import useERC20 from 'hooks/useERC20';
import { gasLimit } from 'utils/gas';
import useIsContract from 'hooks/useIsContract';
import useIsPermit from 'hooks/useIsPermit';
import usePermit2 from 'hooks/usePermit2';
import { MAX_UINT256, WEI_PER_ETHER } from 'utils/const';
import waitForTransaction from 'utils/waitForTransaction';
import dayjs from 'dayjs';
import { splitSignature } from '@ethersproject/bytes';
import useDelayedEffect from 'hooks/useDelayedEffect';

const DESTINATION_CHAIN = optimism.id;

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
  asset?: AssetBalance;
  chains?: Chain[];
  assets?: AssetBalance[];
  routes?: Route[];
  destinationCallData?: DestinationCallData;
  route?: Route | null;
  tx?: Transaction;
  qtyOut?: bigint;
  txStep?: TXStep;
  protocol?: Protocol;
  qtyOutUSD?: bigint;
  activeRoutes?: ActiveRoute[];
  bridgeStatus?: BridgeStatus;
  isBridge: boolean;
  setChain: SetProp<ContextValues, 'chain'>;
  setAsset: SetProp<ContextValues, 'asset'>;
  setRoute: SetProp<ContextValues, 'route'>;
  setScreen: SetProp<ContextValues, 'screen'>;
  setQtyIn: SetProp<ContextValues, 'qtyIn'>;
  setTXStep: SetProp<ContextValues, 'txStep'>;
  socketSubmit: () => void;
  submit: () => void;
  approve: () => void;
};

const GetEXAContext = createContext<ContextValues | null>(null);

export const GetEXAProvider: FC<PropsWithChildren> = ({ children }) => {
  const [screen, setScreen] = useState<Screen>(Screen.SELECT_ROUTE);
  const [qtyIn, setQtyIn] = useState<string>('');
  const [txError, setTXError] = useState<ContextValues['txError']>();
  const [socketError, setSocketError] = useState<ContextValues['socketError']>();
  const [chain, setChain] = useState<ContextValues['chain']>();
  const [asset, setAsset] = useState<ContextValues['asset']>();
  const [chains, setChains] = useState<ContextValues['chains']>();
  const [routes, setRoutes] = useState<ContextValues['routes']>();
  const [destinationCallData, setDestinationCallData] = useState<ContextValues['destinationCallData']>();
  const [route, setRoute] = useState<ContextValues['route']>();
  const [tx, setTX] = useState<ContextValues['tx']>();
  const [txStep, setTXStep] = useState<ContextValues['txStep']>(TXStep.APPROVE);
  const [activeRoutes, setActiveRoutes] = useState<ContextValues['activeRoutes']>();
  const [bridgeStatus, setBridgeStatus] = useState<ContextValues['bridgeStatus']>();

  const { walletAddress, opts, chain: appChain } = useWeb3();
  const { data: walletClient } = useWalletClient({ chainId: chain?.chainId });
  const { t } = useTranslation();
  const swapper = useSwapper();
  const exaethPrice = useEXAETHPrice();
  const assets = useSocketAssets();
  const chainAssets = useMemo(
    () => assets.filter(({ chainId }) => chainId === chain?.chainId),
    [assets, chain?.chainId],
  );
  const exaPrice = useEXAPrice();
  const isBridge = chain?.chainId !== appChain.id;

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
    if (!asset || !chain || !walletAddress || !swapper) return;

    setRoutes(undefined);
    setSocketError(undefined);

    if (parseEther(qtyIn) === 0n) {
      return;
    }

    const destinationPayload = encodeFunctionData({
      abi: swapperABI,
      functionName: 'swap',
      args: [walletAddress, 0n, 0n],
    });
    try {
      const quote = await socketQuote({
        fromChainId: chain.chainId,
        toChainId: DESTINATION_CHAIN,
        fromTokenAddress: asset.address,
        fromAmount: parseUnits(qtyIn, asset.decimals),
        userAddress: walletAddress || zeroAddress,
        toTokenAddress: NATIVE_TOKEN_ADDRESS,
        destinationPayload,
        recipient: swapper.address,
        destinationGasLimit: 2000000n,
      });

      setRoutes(quote?.routes || []);
      setDestinationCallData(quote?.destinationCallData);
      setRoute(quote?.routes[0]);
    } catch (e) {
      setRoutes([]);
      setRoute(undefined);
      setSocketError({ message: t('Error fetching routes from socket'), status: true });
    }
  }, [asset, chain, qtyIn, swapper, t, walletAddress]);

  const erc20 = useERC20(asset?.address === NATIVE_TOKEN_ADDRESS ? undefined : asset?.address, chain?.chainId);

  const isMultiSig = useIsContract();
  const isPermit = useIsPermit();
  const permit2 = usePermit2();

  const approveSameChain = useCallback(async () => {
    if (!walletAddress || !erc20 || !swapper || !asset || !opts || !permit2) return;
    try {
      const minimumApprovalAmount = parseUnits(qtyIn, asset.decimals);
      const approvePermit2 = !(await isPermit(asset.address));

      if (await isMultiSig(walletAddress)) {
        const allowance = await erc20.read.allowance([walletAddress, swapper.address], opts);

        if (allowance < minimumApprovalAmount) {
          const args = [swapper.address, minimumApprovalAmount] as const;
          const gas = await erc20.estimateGas.approve(args, opts);
          const hash = await erc20.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          await waitForTransaction({ hash });
        }
      } else if (approvePermit2) {
        const allowance = await erc20.read.allowance([walletAddress, permit2.address], opts);

        if (allowance < minimumApprovalAmount) {
          const args = [permit2.address, MAX_UINT256] as const;
          const gas = await erc20.estimateGas.approve(args, opts);
          const hash = await erc20.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          setTX({ status: 'processing', hash });
          const { status, transactionHash } = await waitForTransaction({ hash });
          setTX({ status: status ? 'success' : 'error', hash: transactionHash });
        }
      }
      setTXStep(TXStep.CONFIRM);
    } catch (err) {
      setTXError({ message: t('Error approving token'), status: true });
    }
  }, [asset, erc20, isMultiSig, isPermit, opts, permit2, qtyIn, swapper, t, walletAddress]);

  const { signTypedDataAsync } = useSignTypedData();

  const sign = useCallback(async () => {
    if (!walletAddress || !asset || !erc20 || !permit2 || !swapper) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const value = parseUnits(qtyIn || '0', asset.decimals);
    const chainId = appChain.id;

    if (await isPermit(asset.address)) {
      const nonce = await erc20.read.nonces([walletAddress], opts);
      const name = await erc20.read.name(opts);

      const { v, r, s } = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name,
          version: '1',
          chainId,
          verifyingContract: erc20.address,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        message: {
          owner: walletAddress,
          spender: swapper.address,
          value,
          nonce,
          deadline,
        },
      }).then(splitSignature);

      const permit = {
        value,
        deadline,
        ...{ v, r: r as Hex, s: s as Hex },
      } as const;

      return { type: 'permit', value: permit } as const;
    }

    const signature = await signTypedDataAsync({
      primaryType: 'PermitTransferFrom',
      domain: {
        name: 'Permit2',
        chainId,
        verifyingContract: permit2.address,
      },
      types: {
        PermitTransferFrom: [
          { name: 'permitted', type: 'TokenPermissions' },
          { name: 'spender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
        TokenPermissions: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      message: {
        permitted: {
          token: asset.address,
          amount: value,
        },
        spender: swapper.address,
        deadline,
        nonce: hexToBigInt(
          keccak256(
            encodeAbiParameters(
              [
                { name: 'sender', type: 'address' },
                { name: 'token', type: 'address' },
                { name: 'assets', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
              ],
              [walletAddress, asset.address, value, deadline],
            ),
          ),
        ),
      },
    });

    const permit = {
      amount: value,
      deadline,
      signature,
    } as const;

    return { type: 'permit2', value: permit } as const;
  }, [appChain.id, asset, erc20, isPermit, opts, permit2, qtyIn, signTypedDataAsync, swapper, walletAddress]);

  const approveCrossChain = useCallback(async () => {
    if (asset?.symbol === 'ETH') setTXStep(TXStep.CONFIRM);

    if (screen !== Screen.REVIEW_ROUTE || !walletAddress || !walletClient || !route || !erc20 || !opts) return;

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
  }, [asset?.symbol, chain?.chainId, erc20, opts, route, screen, walletAddress, walletClient]);

  const nativeSwap = asset?.symbol === 'ETH' && chain?.chainId === optimism.id;
  const qtyOut =
    qtyIn === ''
      ? 0n
      : exaethPrice !== undefined
      ? nativeSwap
        ? (parseEther(qtyIn) * WEI_PER_ETHER) / exaethPrice
        : route
        ? (BigInt(route.toAmount) * WEI_PER_ETHER) / exaethPrice
        : 0n
      : undefined;

  const confirmBridge = useCallback(async () => {
    if (txStep !== TXStep.CONFIRM || !walletClient || !route) return;

    try {
      const { txTarget, txData, value } = await socketBuildTX({ route, destinationCallData });
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
  }, [destinationCallData, route, txStep, walletClient]);

  const socketSubmit = useCallback(async () => {
    const minEXA = 0n;
    const keepETH = 0n;
    if (isBridge) return confirmBridge();

    if (!walletAddress || !route || !swapper || !erc20?.address || !opts || !asset) return;

    setTXStep(TXStep.CONFIRM_PENDING);

    let hash: Hash;

    try {
      const { txData } = await socketBuildTX({ route });
      if (await isMultiSig(walletAddress)) {
        const amount = parseUnits(qtyIn, asset.decimals);
        const args = [erc20.address, amount, txData, minEXA, keepETH] as const;
        const gas = await swapper.estimateGas.swap(args, opts);

        hash = await swapper.write.swap(args, {
          ...opts,
          gasLimit: gasLimit(gas),
        });
      } else {
        const permit = await sign();
        if (!permit) return;

        switch (permit.type) {
          case 'permit': {
            const args = [erc20.address, permit.value, txData, minEXA, keepETH] as const;
            const gas = await swapper.estimateGas.swap(args, opts);
            hash = await swapper.write.swap(args, {
              ...opts,
              gasLimit: gasLimit(gas),
            });
            break;
          }
          case 'permit2': {
            const args = [erc20.address, permit.value, txData, minEXA, keepETH] as const;
            const gas = await swapper.estimateGas.swap(args, opts);
            hash = await swapper.write.swap(args, {
              ...opts,
              gasLimit: gasLimit(gas),
            });
            break;
          }
        }

        if (!hash) return;
        setScreen(Screen.TX_STATUS);
        setTX({ status: 'processing', hash });
        const { status, transactionHash } = await waitForTransaction({ hash });
        setTX({ status: status ? 'success' : 'error', hash: transactionHash });
      }
    } catch (err) {
      setTXError({ status: true, message: handleOperationError(err) });
    } finally {
      setTXStep(undefined);
    }
  }, [isBridge, confirmBridge, walletAddress, route, swapper, erc20, opts, asset, isMultiSig, qtyIn, sign]);

  const submit = useCallback(async () => {
    if (!walletClient || !walletAddress || !swapper) return;
    setTXStep(TXStep.CONFIRM_PENDING);

    const data = encodeFunctionData({
      abi: swapperABI,
      functionName: 'swap',
      args: [walletAddress, 0n, 0n],
    });
    try {
      const txHash_ = await walletClient.sendTransaction({
        to: swapper.address,
        data,
        value: parseEther(qtyIn),
      });

      setScreen(Screen.TX_STATUS);

      setTX({ status: 'processing', hash: txHash_ });
      const { status, transactionHash } = await waitForTransaction({ hash: txHash_ });
      setTX({ status: status ? 'success' : 'error', hash: transactionHash });
    } catch (err) {
      setTXError({ status: true, message: handleOperationError(err) });
    } finally {
      setTXStep(undefined);
    }
  }, [qtyIn, setTXError, setScreen, setTXStep, swapper, walletAddress, walletClient]);

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

  useEffect(() => {
    setAsset(chainAssets[0]);
  }, [chainAssets]);

  const fetchActiveRoutes = useCallback(async () => {
    if (!walletAddress) return;
    const response = await socketActiveRoutes({ userAddress: walletAddress });
    setActiveRoutes(response.activeRoutes);
  }, [walletAddress]);

  useEffect(() => {
    fetchActiveRoutes();
  }, [fetchActiveRoutes]);

  const value: ContextValues = {
    setScreen: (s: ContextValues['screen']) => {
      setScreen(s);
      if (s === Screen.REVIEW_ROUTE && asset?.symbol === 'ETH') {
        setTXStep(TXStep.CONFIRM);
      }
      if (s === Screen.SELECT_ROUTE) {
        setTXStep(undefined);
        setTXError(undefined);
      }
    },
    setAsset: (a: ContextValues['asset']) => {
      setAsset(a);
      setQtyIn('');
    },

    setChain: (c: ContextValues['chain']) => {
      setChain(c);
      const chainAssets_ = assets.filter(({ chainId }) => chainId === c?.chainId);
      setAsset(chainAssets_[0]);
      setQtyIn('');
    },
    setQtyIn,
    setTXStep,
    approve: isBridge ? approveCrossChain : approveSameChain,
    setRoute,
    socketSubmit,
    submit,
    screen,
    qtyIn,
    txError,
    socketError,
    chain,
    asset,
    chains,
    routes,
    assets: chainAssets,
    route: routesLoading ? undefined : route,
    tx,
    txStep,
    qtyOut,
    protocol:
      route?.userTxs?.[route?.userTxs.length - 1]?.protocol ||
      route?.userTxs?.[0].steps?.[(route.userTxs[0]?.stepCount || 0) - 1].protocol,
    qtyOutUSD: qtyOut !== undefined && exaPrice ? (qtyOut * exaPrice) / WEI_PER_ETHER : undefined,
    activeRoutes,
    bridgeStatus,
    isBridge,
  };

  return <GetEXAContext.Provider value={value}>{children}</GetEXAContext.Provider>;
};

export const useGetEXA = () => {
  const ctx = useContext(GetEXAContext);
  if (!ctx) {
    throw new Error('Using GetExaContext outside of provider');
  }
  return ctx;
};

export default GetEXAContext;
