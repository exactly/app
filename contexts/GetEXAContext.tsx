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
  encodeFunctionData,
  parseEther,
  parseUnits,
  zeroAddress,
  hexToBigInt,
  hexToSignature,
  keccak256,
  encodeAbiParameters,
  formatUnits,
} from 'viem';
import * as viemChains from 'viem/chains';

import { useSignTypedData, useWalletClient } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import { optimism } from 'viem/chains';

import { MAX_UINT256, WAD } from '@exactly/lib';

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
import { swapperAbi, swapperAddress, permit2Address } from 'generated/wagmi';
import { useEXAETHPrice, useEXAPrice } from 'hooks/useEXA';
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
import useIsContract from 'hooks/useIsContract';
import useIsPermit from 'hooks/useIsPermit';
import waitForTransaction from 'utils/waitForTransaction';
import dayjs from 'dayjs';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { track } from 'utils/mixpanel';
import useContractVersion from 'hooks/useContractVersion';
import { defaultChain, isE2E, wagmi } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

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
  const [sourceChain, setSourceChain] = useState<ContextValues['chain']>();
  const [asset, setAsset] = useState<ContextValues['asset']>();
  const [chains, setChains] = useState<ContextValues['chains']>();
  const [routes, setRoutes] = useState<ContextValues['routes']>();
  const [destinationCallData, setDestinationCallData] = useState<ContextValues['destinationCallData']>();
  const [route, setRoute] = useState<ContextValues['route']>();
  const [tx, setTX] = useState<ContextValues['tx']>();
  const [txStep, setTXStep] = useState<ContextValues['txStep']>(TXStep.APPROVE);
  const [activeRoutes, setActiveRoutes] = useState<ContextValues['activeRoutes']>();
  const [bridgeStatus, setBridgeStatus] = useState<ContextValues['bridgeStatus']>();

  const { account: walletAddress } = useReadOnly();
  const destinationChain = isE2E ? defaultChain.id : optimism.id;
  const { data: walletClient } = useWalletClient({ chainId: sourceChain?.chainId });
  const { t } = useTranslation();
  const swapper = Object.entries(swapperAddress).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];
  const exaethPrice = useEXAETHPrice();
  const assets = useSocketAssets();
  const chainAssets = useMemo(
    () => assets.filter(({ chainId }) => chainId === sourceChain?.chainId),
    [assets, sourceChain?.chainId],
  );
  const exaPrice = useEXAPrice();
  const isBridge = sourceChain?.chainId !== defaultChain.id;

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
    if (!asset || !sourceChain || !walletAddress || !swapper) return;

    setRoutes(undefined);
    setSocketError(undefined);

    if (parseEther(qtyIn) === 0n) {
      return;
    }

    const destinationPayload = encodeFunctionData({
      abi: swapperAbi,
      functionName: 'swap',
      args: [walletAddress, 0n, 0n],
    });
    try {
      const quote = await socketQuote({
        fromChainId: sourceChain.chainId,
        toChainId: destinationChain,
        fromTokenAddress: asset.address,
        fromAmount: parseUnits(qtyIn, asset.decimals),
        userAddress: walletAddress || zeroAddress,
        toTokenAddress: NATIVE_TOKEN_ADDRESS,
        destinationPayload,
        recipient: swapper,
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
  }, [asset, sourceChain, destinationChain, qtyIn, swapper, t, walletAddress]);

  const erc20 = useERC20(asset?.address === NATIVE_TOKEN_ADDRESS ? undefined : asset?.address, sourceChain?.chainId);

  const isMultiSig = useIsContract();
  const isPermit = useIsPermit();
  const contractVersion = useContractVersion();
  const permit2 = Object.entries(permit2Address).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];

  const approveSameChain = useCallback(async () => {
    if (!walletAddress || !erc20 || !swapper || !asset || !walletAddress || !permit2) return;
    try {
      const minimumApprovalAmount = parseUnits(qtyIn, asset.decimals);
      const approvePermit2 = !(await isPermit(asset.address));

      if (await isMultiSig(walletAddress)) {
        const allowance = await erc20.read.allowance([walletAddress, swapper], {
          account: walletAddress,
        });

        if (allowance < minimumApprovalAmount) {
          const args = [swapper, minimumApprovalAmount] as const;
          const gas = await erc20.estimateGas.approve(args, { account: walletAddress });
          const hash = await erc20.write.approve(args, {
            account: walletAddress,
            chain: defaultChain,
            gas: gasLimit(gas),
          });
          track('TX Signed', {
            contractName: 'ERC20',
            method: 'approve',
            amount: qtyIn,
            hash,
          });
          const { status } = await waitForTransaction({ hash });
          track('TX Completed', {
            contractName: 'ERC20',
            method: 'approve',
            amount: qtyIn,
            hash,
            status,
            symbol: asset.symbol,
          });
        }
      } else if (approvePermit2) {
        const allowance = await erc20.read.allowance([walletAddress, permit2], {
          account: walletAddress,
        });

        if (allowance < minimumApprovalAmount) {
          const args = [permit2, MAX_UINT256] as const;
          const gas = await erc20.estimateGas.approve(args, { account: walletAddress });
          const hash = await erc20.write.approve(args, {
            account: walletAddress,
            chain: defaultChain,
            gas: gasLimit(gas),
          });
          setTX({ status: 'processing', hash });
          track('TX Signed', {
            contractName: 'ERC20',
            method: 'approve',
            amount: 'MAX_UINT256',
            hash,
            to: permit2,
            symbol: asset.symbol,
          });
          const { status, transactionHash } = await waitForTransaction({ hash });
          track('TX Completed', {
            contractName: 'ERC20',
            method: 'approve',
            amount: 'MAX_UINT256',
            hash,
            status,
            to: permit2,
            symbol: asset.symbol,
          });
          setTX({ status: status ? 'success' : 'error', hash: transactionHash });
        }
      }
      setTXStep(TXStep.CONFIRM);
    } catch (err) {
      setTXError({ message: t('Error approving token'), status: true });
    }
  }, [asset, erc20, isMultiSig, isPermit, permit2, qtyIn, swapper, t, walletAddress]);

  const { signTypedDataAsync } = useSignTypedData();

  const sign = useCallback(async () => {
    if (!walletAddress || !asset || !erc20 || !permit2 || !swapper) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const value = parseUnits(qtyIn || '0', asset.decimals);
    const chainId = defaultChain.id;

    if (await isPermit(asset.address)) {
      const nonce = await erc20.read.nonces([walletAddress], { account: walletAddress });
      const name = await erc20.read.name({ account: walletAddress });
      const version = await contractVersion(asset.address);

      const { v, r, s } = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name,
          version,
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
          spender: swapper,
          value,
          nonce,
          deadline,
        },
      }).then(hexToSignature);

      const permit = {
        value,
        deadline,
        ...{ v: Number(v), r, s },
      } as const;

      return { type: 'permit', value: permit } as const;
    }

    const signature = await signTypedDataAsync({
      primaryType: 'PermitTransferFrom',
      domain: {
        name: 'Permit2',
        chainId,
        verifyingContract: permit2,
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
        spender: swapper,
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
  }, [asset, contractVersion, erc20, isPermit, permit2, qtyIn, signTypedDataAsync, swapper, walletAddress]);

  const approveCrossChain = useCallback(async () => {
    if (asset?.symbol === 'ETH') setTXStep(TXStep.CONFIRM);

    if (screen !== Screen.REVIEW_ROUTE || !walletAddress || !walletClient || !route || !erc20 || !walletAddress) return;

    const {
      userTxs: [{ approvalData }],
    } = route;

    const supportedChains = Object.values(viemChains);

    const crossChainOpts = {
      account: walletAddress,
      chain: supportedChains.find((c) => c.id === sourceChain?.chainId),
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
        const gas = await erc20.estimateGas.approve(args, { account: walletAddress });
        const hash = await erc20.write.approve(args, {
          ...crossChainOpts,
          gas: gasLimit(gas),
        });
        track('TX Signed', {
          contractName: 'ERC20',
          method: 'approve',
          amount: formatUnits(minimumApprovalAmount, asset?.decimals || 18),
          hash,
          to: approvalData.allowanceTarget,
          symbol: asset?.symbol,
        });
        const { status } = await waitForTransaction({ hash });

        track('TX Completed', {
          contractName: 'ERC20',
          method: 'approve',
          amount: formatUnits(minimumApprovalAmount, asset?.decimals || 18),
          hash,
          to: approvalData.allowanceTarget,
          status,
          symbol: asset?.symbol,
        });
      }
      setTXStep(TXStep.CONFIRM);
    } catch (err) {
      if (err instanceof Error) {
        setTXError({ status: true, message: handleOperationError(err) });
      }
      setTXStep(TXStep.APPROVE);
    }
  }, [asset, sourceChain?.chainId, erc20, route, screen, walletAddress, walletClient]);

  const nativeSwap = asset?.symbol === 'ETH' && sourceChain?.chainId === destinationChain;
  const qtyOut =
    qtyIn === ''
      ? 0n
      : exaethPrice !== undefined
        ? nativeSwap
          ? (parseEther(qtyIn) * WAD) / exaethPrice
          : route
            ? (BigInt(route.toAmount) * WAD) / exaethPrice
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

      track('TX Signed', {
        contractName: 'SocketGateway',
        method: 'swap',
        amount: qtyIn,
        symbol: asset?.symbol,
        hash: txHash_,
        to: txTarget,
      });

      const { status, transactionHash } = await waitForTransaction({ hash: txHash_ });

      track('TX Completed', {
        contractName: 'ERC20',
        method: 'approve',
        amount: qtyIn,
        symbol: asset?.symbol,
        hash: transactionHash,
        to: txTarget,
        status,
      });
      setTX({ status: status ? 'success' : 'error', hash: transactionHash });
      setScreen(Screen.TX_STATUS);
    } catch (err) {
      setTXError({ status: true, message: handleOperationError(err) });
      setTXStep(TXStep.CONFIRM);
    }
  }, [asset?.symbol, destinationCallData, qtyIn, route, txStep, walletClient]);

  const socketSubmit = useCallback(async () => {
    const minEXA = 0n;
    const keepETH = 0n;
    if (isBridge) return confirmBridge();

    if (!walletAddress || !route || !swapper || !erc20?.address || !walletAddress || !asset) return;

    setTXStep(TXStep.CONFIRM_PENDING);

    let hash: Hash;

    try {
      const { txData } = await socketBuildTX({ route });
      if (await isMultiSig(walletAddress)) {
        const amount = parseUnits(qtyIn, asset.decimals);
        const args = [erc20.address, amount, txData, minEXA, keepETH] as const;
        const { request } = await simulateContract(wagmi, {
          account: walletAddress,
          address: swapper,
          abi: swapperAbi,
          functionName: 'swap',
          chainId: defaultChain.id,
          args,
        });
        hash = await writeContract(wagmi, request);
      } else {
        const permit = await sign();
        if (!permit) return;

        switch (permit.type) {
          case 'permit': {
            const args = [erc20.address, permit.value, txData, minEXA, keepETH] as const;
            const { request } = await simulateContract(wagmi, {
              account: walletAddress,
              address: swapper,
              abi: swapperAbi,
              functionName: 'swap',
              chainId: defaultChain.id,
              args,
            });
            hash = await writeContract(wagmi, request);
            break;
          }
          case 'permit2': {
            const args = [erc20.address, permit.value, txData, minEXA, keepETH] as const;
            const { request } = await simulateContract(wagmi, {
              account: walletAddress,
              address: swapper,
              abi: swapperAbi,
              functionName: 'swap',
              chainId: defaultChain.id,
              args,
            });
            hash = await writeContract(wagmi, request);
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
  }, [isBridge, confirmBridge, walletAddress, route, swapper, erc20, asset, isMultiSig, qtyIn, sign]);

  const submit = useCallback(async () => {
    if (!walletAddress || !swapper) return;
    setTXStep(TXStep.CONFIRM_PENDING);

    try {
      const txHash_ = await writeContract(wagmi, {
        account: walletAddress,
        address: swapper,
        abi: swapperAbi,
        functionName: 'swap',
        chainId: defaultChain.id,
        args: [walletAddress, 0n, 0n],
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
  }, [qtyIn, setTXError, setScreen, setTXStep, swapper, walletAddress]);

  useEffect(() => {
    if (!isBridge) return;
    if (bridgeStatus) {
      const { destinationTxStatus, sourceTxStatus } = bridgeStatus;
      const bridgeInProgess = sourceTxStatus === 'PENDING' || destinationTxStatus === 'PENDING';
      if (!bridgeInProgess) return;
    }
    const fetchBridgeStatus = async () => {
      if (!tx?.hash || !sourceChain) return;
      try {
        const response = await socketBridgeStatus({
          transactionHash: tx.hash,
          fromChainId: sourceChain.chainId,
          toChainId: destinationChain,
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
  }, [isBridge, bridgeStatus, sourceChain, destinationChain, tx?.hash]);

  const { isLoading: routesLoading } = useDelayedEffect({
    effect: fetchRoutes,
    delay: 1000,
  });

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  useEffect(() => {
    if (!chains) return;
    const activeNetwork = chains.find(({ chainId }) => chainId === destinationChain);
    if (activeNetwork) setSourceChain(activeNetwork);
  }, [chains, destinationChain, setSourceChain]);

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
      setSourceChain(c);
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
    chain: sourceChain,
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
    qtyOutUSD: qtyOut !== undefined && exaPrice ? (qtyOut * exaPrice) / WAD : undefined,
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
