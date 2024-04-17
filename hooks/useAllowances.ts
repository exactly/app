import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, erc20ABI, erc4626ABI, usePublicClient } from 'wagmi';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import MAX_UINT256 from '@exactly/lib/esm/fixed-point-math/MAX_UINT256';
import useDebtManager from './useDebtManager';
import useAccountData from './useAccountData';
import useETHRouter from './useETHRouter';
import { useWeb3 } from './useWeb3';
import useAssets from './useAssets';
import useContract from './useContract';
import { installmentsRouterABI } from 'types/abi';

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
  const { getMarketAccount } = useAccountData();
  const { walletAddress, chain } = useWeb3();
  const client = usePublicClient({ chainId: chain.id });
  const assetSymbols = useAssets();
  const debtManager = useDebtManager();
  const ethRouter = useETHRouter();
  const installmentsRouter = useContract('InstallmentsRouter', installmentsRouterABI);

  const allowanceDescriptors: AllowanceDescriptor[] = useMemo(() => {
    const debtManagerDescriptor = (asset: string) =>
      debtManager
        ? ([
            {
              symbol: asset,
              spenderAddress: debtManager.address,
              spenderName: 'DebtManager',
              type: 'directAsset',
            },
            {
              symbol: asset,
              spenderAddress: debtManager.address,
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
              spenderAddress: installmentsRouter.address,
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
      ? ([{ symbol: 'WETH', spenderAddress: ethRouter.address, spenderName: 'ETHRouter', type: 'shareAsset' }] as const)
      : [];

    return [...assetDescriptors, ...ethRouterDescriptor];
  }, [assetSymbols, debtManager, ethRouter, installmentsRouter]);

  const descriptorToAllowance = useCallback(
    async (descriptor: AllowanceDescriptor, owner: Address) => {
      const marketAccount = getMarketAccount(descriptor.symbol);
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
        abi: erc4626ABI,
        address: token,
        functionName: 'allowance',
        args: [owner, spenderAddress],
      });
      const totalSupply = await client.readContract({
        abi: erc20ABI,
        address: token,
        functionName: 'totalSupply',
      });
      const unlimited = allowance > totalSupply;
      try {
        allowanceUSD =
          ((descriptor.type === 'shareAsset'
            ? await client.readContract({
                abi: erc4626ABI,
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
    [client, getMarketAccount],
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
