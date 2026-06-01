import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { type Address, erc20Abi, erc4626Abi } from 'viem';
import { MAX_UINT256, WAD } from '@exactly/lib';
import usePreviewerExactly from './usePreviewerExactly';
import useAssets from './useAssets';
import { debtManagerAddress, installmentsRouterAddress, marketEthRouterAddress } from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

export type Allowance = {
  allowance: bigint;
  allowanceUSD: bigint;
  symbol: string;
  token: Address;
  decimals: number;
  spenderAddress: Address;
  spenderName: string;
  unlimited: boolean;
};

export type AllowancesState = {
  data?: Allowance[];
  loading: boolean;
  update: () => Promise<void>;
};

type AllowanceDescriptor = {
  symbol: string;
} & (
  | {
      type: 'directAsset' | 'shareAsset';
      spenderAddress: Address;
      spenderName: string;
    }
  | {
      type: 'marketSpender';
    }
);

export const useAllowances = (): AllowancesState => {
  const [allowances, setAllowances] = useState<Allowance[]>();
  const [loading, setLoading] = useState(true);
  const { data } = usePreviewerExactly();
  const { account: walletAddress } = useReadOnly();
  const client = usePublicClient({ chainId: defaultChain.id });
  const assetSymbols = useAssets();
  const debtManager = Object.entries(debtManagerAddress).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];
  const ethRouter = Object.entries(marketEthRouterAddress).find(
    ([chainId]) => Number(chainId) === defaultChain.id,
  )?.[1];
  const installmentsRouter = Object.entries(installmentsRouterAddress).find(
    ([chainId]) => Number(chainId) === defaultChain.id,
  )?.[1];

  const allowanceDescriptors: AllowanceDescriptor[] = useMemo(() => {
    const debtManagerDescriptor = (asset: string) =>
      debtManager
        ? ([
            {
              symbol: asset,
              spenderAddress: debtManager,
              spenderName: 'DebtManager',
              type: 'directAsset',
            },
            {
              symbol: asset,
              spenderAddress: debtManager,
              spenderName: 'DebtManager',
              type: 'shareAsset',
            },
          ] as const)
        : [];

    const installmentsRouterDescriptor = (asset: string) =>
      installmentsRouter
        ? ([
            {
              symbol: asset,
              spenderAddress: installmentsRouter,
              spenderName: 'InstallmentsRouter',
              type: 'shareAsset',
            },
          ] as const)
        : [];

    const assetDescriptors = assetSymbols.flatMap((asset) => [
      ...debtManagerDescriptor(asset),
      ...installmentsRouterDescriptor(asset),
      {
        symbol: asset,
        type: 'marketSpender',
      } as const,
    ]);
    const ethRouterDescriptor = ethRouter
      ? ([{ symbol: 'WETH', spenderAddress: ethRouter, spenderName: 'ETHRouter', type: 'shareAsset' }] as const)
      : [];

    return [...assetDescriptors, ...ethRouterDescriptor];
  }, [assetSymbols, debtManager, ethRouter, installmentsRouter]);

  const descriptorToAllowance = useCallback(
    async (descriptor: AllowanceDescriptor, owner: Address) => {
      if (!client) return;
      const marketAccount = data?.find((market) => market.assetSymbol === descriptor.symbol);
      if (!marketAccount) return;
      const { asset, market, usdPrice, decimals } = marketAccount;
      let spenderAddress, spenderName, token, symbol, allowanceUSD;
      switch (descriptor.type) {
        case 'directAsset':
          spenderAddress = descriptor.spenderAddress;
          spenderName = descriptor.spenderName;
          token = asset;
          symbol = descriptor.symbol;
          break;
        case 'shareAsset':
          spenderAddress = descriptor.spenderAddress;
          spenderName = descriptor.spenderName;
          token = market;
          symbol = `exa${descriptor.symbol}`;
          break;
        case 'marketSpender':
          spenderAddress = market;
          spenderName = `Market${descriptor.symbol}`;
          token = asset;
          symbol = descriptor.symbol;
          break;
      }
      const allowance = await client.readContract({
        abi: erc4626Abi,
        address: token,
        functionName: 'allowance',
        args: [owner, spenderAddress],
      });
      const totalSupply = await client.readContract({
        abi: erc20Abi,
        address: token,
        functionName: 'totalSupply',
      });
      const unlimited = allowance > totalSupply;
      try {
        allowanceUSD =
          ((descriptor.type === 'shareAsset'
            ? await client.readContract({
                abi: erc4626Abi,
                address: token,
                functionName: 'convertToAssets',
                args: [allowance],
              })
            : allowance) *
            usdPrice) /
          WAD;
      } catch {
        allowanceUSD = 0n;
      }
      return {
        symbol,
        spenderAddress,
        spenderName,
        token,
        decimals,
        unlimited,
        allowance,
        allowanceUSD: unlimited ? MAX_UINT256 : allowanceUSD,
      };
    },
    [client, data],
  );

  const update = useCallback(async () => {
    if (!walletAddress) return;
    const allowancesData = (await Promise.all(allowanceDescriptors.map((d) => descriptorToAllowance(d, walletAddress))))
      .filter((a): a is Allowance => a !== undefined && a.allowance !== 0n)
      .sort((a1, a2) => (a1.allowanceUSD > a2.allowanceUSD ? -1 : 1));
    setAllowances(allowancesData);
  }, [allowanceDescriptors, descriptorToAllowance, walletAddress]);

  useEffect(() => {
    setLoading(true);
    update();
    setLoading(false);
  }, [update]);

  return { data: allowances, loading: loading, update };
};
