import { useMemo } from 'react';
import { WAD } from '@exactly/lib';

import usePreviewerExactly from './usePreviewerExactly';
import useDashboard from './useDashboard';
import { Address, parseEther } from 'viem';
import useRewards from './useRewards';
import useStETHNativeAPR from './useStETHNativeAPR';
import useReadOnly from 'hooks/useReadOnly';
import { useContractEvents } from 'wagmi';
import { marketAbi, marketBlocks } from 'generated/wagmi';
import { defaultChain } from 'utils/client';

type FixedRateEvent =
  | {
      market: Address;
      maturity: bigint;
      borrow: boolean;
      assets: bigint;
      fee: bigint;
      timestamp?: bigint;
      blockNumber: bigint;
      logIndex: number;
    }
  | {
      market: Address;
      maturity: bigint;
      borrow: boolean;
      positionAssets: bigint;
      blockNumber: bigint;
      logIndex: number;
    };

const parseAPR = (apr?: number) => parseEther((apr !== undefined && Number.isFinite(apr) ? apr : 0).toFixed(18));

export default () => {
  const { account } = useReadOnly();
  const { data: accountData, isFetching } = usePreviewerExactly();
  const { floatingRows: floatingDeposit } = useDashboard('deposit');
  const { floatingRows: floatingBorrow } = useDashboard('borrow');
  const stETHNativeAPR = useStETHNativeAPR();
  const { rates } = useRewards();

  const { hasFixedDeposits, hasFixedBorrows, marketAddresses, fromBlock } = useMemo(() => {
    if (!accountData) return { hasFixedDeposits: false, hasFixedBorrows: false, marketAddresses: [] as Address[] };
    const marketBlocksByAddress = marketBlocks[defaultChain.id as keyof typeof marketBlocks] as
      | Record<string, bigint>
      | undefined;
    const fixedMarkets = accountData.flatMap(({ market, fixedBorrowPositions, fixedDepositPositions }) => {
      if (fixedBorrowPositions.length === 0 && fixedDepositPositions.length === 0) return [];
      const block = marketBlocksByAddress?.[market.toLowerCase()];
      return block === undefined ? [] : [{ market, fromBlock: block }];
    });

    return {
      hasFixedDeposits: accountData.some(({ fixedDepositPositions }) => fixedDepositPositions.length > 0),
      hasFixedBorrows: accountData.some(({ fixedBorrowPositions }) => fixedBorrowPositions.length > 0),
      marketAddresses: fixedMarkets.map(({ market }) => market),
      fromBlock: fixedMarkets.reduce<bigint | undefined>(
        (min, { fromBlock: block }) => (min === undefined || block < min ? block : min),
        undefined,
      ),
    };
  }, [accountData]);

  const {
    data: depositEvents = [],
    isLoading: depositEventsLoading,
    isFetching: depositEventsFetching,
  } = useContractEvents({
    address: marketAddresses,
    abi: marketAbi,
    eventName: 'DepositAtMaturity',
    strict: true,
    args: account ? { owner: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    query: {
      enabled: hasFixedDeposits && Boolean(account && marketAddresses.length),
      select: (logs) =>
        logs.map((log): FixedRateEvent => {
          const { maturity, assets, fee } = log.args;
          return {
            market: log.address,
            maturity,
            borrow: false,
            assets,
            fee,
            timestamp: log.blockTimestamp === undefined ? undefined : BigInt(log.blockTimestamp),
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
          };
        }),
    },
  });
  const {
    data: withdrawEvents = [],
    isLoading: withdrawEventsLoading,
    isFetching: withdrawEventsFetching,
  } = useContractEvents({
    address: marketAddresses,
    abi: marketAbi,
    eventName: 'WithdrawAtMaturity',
    strict: true,
    args: account ? { owner: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    query: {
      enabled: hasFixedDeposits && Boolean(account && marketAddresses.length),
      select: (logs) =>
        logs.map((log): FixedRateEvent => {
          const { maturity, positionAssets } = log.args;
          return {
            market: log.address,
            maturity,
            borrow: false,
            positionAssets,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
          };
        }),
    },
  });
  const {
    data: borrowEvents = [],
    isLoading: borrowEventsLoading,
    isFetching: borrowEventsFetching,
  } = useContractEvents({
    address: marketAddresses,
    abi: marketAbi,
    eventName: 'BorrowAtMaturity',
    strict: true,
    args: account ? { borrower: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    query: {
      enabled: hasFixedBorrows && Boolean(account && marketAddresses.length),
      select: (logs) =>
        logs.map((log): FixedRateEvent => {
          const { maturity, assets, fee } = log.args;
          return {
            market: log.address,
            maturity,
            borrow: true,
            assets,
            fee,
            timestamp: log.blockTimestamp === undefined ? undefined : BigInt(log.blockTimestamp),
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
          };
        }),
    },
  });
  const {
    data: repayEvents = [],
    isLoading: repayEventsLoading,
    isFetching: repayEventsFetching,
  } = useContractEvents({
    address: marketAddresses,
    abi: marketAbi,
    eventName: 'RepayAtMaturity',
    strict: true,
    args: account ? { borrower: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    query: {
      enabled: hasFixedBorrows && Boolean(account && marketAddresses.length),
      select: (logs) =>
        logs.map((log): FixedRateEvent => {
          const { maturity, positionAssets } = log.args;
          return {
            market: log.address,
            maturity,
            borrow: true,
            positionAssets,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
          };
        }),
    },
  });

  return useMemo(() => {
    if (
      !accountData ||
      isFetching ||
      (hasFixedDeposits &&
        (depositEventsLoading || depositEventsFetching || withdrawEventsLoading || withdrawEventsFetching)) ||
      (hasFixedBorrows && (borrowEventsLoading || borrowEventsFetching || repayEventsLoading || repayEventsFetching))
    ) {
      return {};
    }
    const markets = Object.values(accountData);
    const now = Math.floor(Date.now() / 1_000);
    const fixedAPRs = [...depositEvents, ...withdrawEvents, ...borrowEvents, ...repayEvents]
      .sort((a, b) =>
        a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1,
      )
      .reduce(
        (positions, event) => {
          const key = `${event.market.toLowerCase()}-${event.maturity}-${event.borrow}`;
          const position = positions[key] ?? { principal: 0n, fee: 0n, rate: 0n };
          if ('assets' in event) {
            if (event.timestamp === undefined || event.maturity <= event.timestamp || event.assets === 0n) {
              return positions;
            }
            const totalAmount = position.principal + event.assets;
            positions[key] = {
              principal: totalAmount,
              fee: position.fee + event.fee,
              rate:
                (position.principal * position.rate +
                  event.assets *
                    ((event.fee * WAD * 31_536_000n) / (event.assets * (event.maturity - event.timestamp)))) /
                totalAmount,
            };
          } else {
            const positionAssets = position.principal + position.fee;
            if (positionAssets === 0n) return positions;
            const principal = (event.positionAssets * position.principal) / positionAssets;
            const fee = event.positionAssets - principal;
            positions[key] = {
              principal: position.principal - principal,
              fee: position.fee - fee,
              rate: position.principal === principal ? 0n : position.rate,
            };
          }
          return positions;
        },
        {} as Record<string, { principal: bigint; fee: bigint; rate: bigint }>,
      );

    const floatingDepositAPRs = floatingDeposit.reduce(
      (acc, { symbol, apr }) => {
        acc[symbol] = parseAPR(apr);
        return acc;
      },
      {} as Record<string, bigint>,
    );

    const floatingBorrowAPRs = floatingBorrow.reduce(
      (acc, { symbol, apr }) => {
        acc[symbol] = parseAPR(apr);
        return acc;
      },
      {} as Record<string, bigint>,
    );

    const totalFloatingDeposits = markets.reduce(
      (total, { floatingDepositAssets, decimals, usdPrice }) =>
        total + (floatingDepositAssets * usdPrice) / BigInt(10 ** decimals),
      0n,
    );

    const projectedFloatingDeposits = markets.reduce(
      (total, { assetSymbol, floatingDepositAssets, decimals, usdPrice }) =>
        total +
        (((floatingDepositAssets * usdPrice) / BigInt(10 ** decimals)) * (floatingDepositAPRs[assetSymbol] || 0n)) /
          WAD,
      0n,
    );

    const projectedFloatingDepositRewards = markets.reduce(
      (total, { assetSymbol, floatingDepositAssets, decimals, usdPrice }) =>
        total +
        rates[assetSymbol].reduce(
          (acc, { floatingDeposit: depositAPR }) =>
            acc + ((floatingDepositAssets * usdPrice) / BigInt(10 ** decimals)) * depositAPR,
          0n,
        ) /
          WAD,
      0n,
    );

    const projectedFloatingDepositNative = markets
      .filter(({ assetSymbol }) => assetSymbol === 'wstETH')
      .reduce(
        (total, { floatingDepositAssets, decimals, usdPrice }) =>
          total + (((floatingDepositAssets * usdPrice) / BigInt(10 ** decimals)) * stETHNativeAPR) / WAD,
        0n,
      );

    const totalFloatingBorrows = markets.reduce(
      (total, { floatingBorrowAssets, decimals, usdPrice }) =>
        total + (floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals),
      0n,
    );

    const projectedFloatingBorrows = markets.reduce(
      (total, { assetSymbol, floatingBorrowAssets, decimals, usdPrice }) =>
        total +
        (((floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals)) * (floatingBorrowAPRs[assetSymbol] || 0n)) / WAD,
      0n,
    );

    const projectedFloatingBorrowRewards = markets.reduce(
      (total, { assetSymbol, floatingBorrowAssets, decimals, usdPrice }) =>
        total +
        rates[assetSymbol].reduce(
          (acc, { borrow }) => acc + ((floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals)) * borrow,
          0n,
        ) /
          WAD,
      0n,
    );

    const totalFixedDeposits = markets.reduce((total, { fixedDepositPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedDepositPositions.reduce(
        (fixedAcc, { position: { principal } }) => fixedAcc + principal,
        0n,
      );
      return total + (fixedPosition * usdPrice) / BigInt(10 ** decimals);
    }, 0n);

    const projectedFixedDeposits = markets.reduce((total, { market, fixedDepositPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedDepositPositions.reduce(
        (fixedAcc, { position: { principal }, maturity }) =>
          fixedAcc +
          (((principal * usdPrice) / BigInt(10 ** decimals)) *
            (maturity < now ? 0n : fixedAPRs[`${market.toLowerCase()}-${maturity}-false`]?.rate || 0n)) /
            WAD,
        0n,
      );
      return total + fixedPosition;
    }, 0n);

    const projectedFixedDepositNative = markets
      .filter(({ assetSymbol }) => assetSymbol === 'wstETH')
      .reduce((total, { fixedDepositPositions, decimals, usdPrice }) => {
        const fixedPosition = fixedDepositPositions.reduce(
          (fixedAcc, { position: { principal } }) =>
            fixedAcc + (((principal * usdPrice) / BigInt(10 ** decimals)) * stETHNativeAPR) / WAD,
          0n,
        );
        return total + fixedPosition;
      }, 0n);

    const totalFixedBorrows = markets.reduce((total, { fixedBorrowPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedBorrowPositions.reduce(
        (fixedAcc, { position: { principal } }) => fixedAcc + principal,
        0n,
      );
      return total + (fixedPosition * usdPrice) / BigInt(10 ** decimals);
    }, 0n);

    const projectedFixedBorrows = markets.reduce((total, { market, fixedBorrowPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedBorrowPositions.reduce(
        (fixedAcc, { position: { principal }, maturity }) =>
          fixedAcc +
          (((principal * usdPrice) / BigInt(10 ** decimals)) *
            (maturity < now ? 0n : fixedAPRs[`${market.toLowerCase()}-${maturity}-true`]?.rate || 0n)) /
            WAD,
        0n,
      );
      return total + fixedPosition;
    }, 0n);

    const projectedFixedBorrowRewards = markets.reduce(
      (total, { assetSymbol, fixedBorrowPositions, decimals, usdPrice }) => {
        const fixedPosition = fixedBorrowPositions.reduce(
          (fixedAcc, { position: { principal } }) =>
            fixedAcc +
            rates[assetSymbol].reduce(
              (acc, { borrow }) => acc + ((principal * usdPrice) / BigInt(10 ** decimals)) * borrow,
              0n,
            ) /
              WAD,
          0n,
        );
        return total + fixedPosition;
      },
      0n,
    );

    const netPosition = totalFloatingDeposits + totalFixedDeposits - totalFloatingBorrows - totalFixedBorrows;
    if (netPosition === 0n) {
      return {
        marketAPR: 0n,
        rewardsAPR: 0n,
        nativeAPR: 0n,
        netAPR: 0n,
        netPosition: 0n,
      };
    }

    const projectedMarketEarnings =
      projectedFloatingDeposits + projectedFixedDeposits - projectedFloatingBorrows - projectedFixedBorrows;

    const projectedRewardsEarnings =
      projectedFixedBorrowRewards + projectedFloatingBorrowRewards + projectedFloatingDepositRewards;

    const projectedNativeEarnings = projectedFixedDepositNative + projectedFloatingDepositNative;

    const marketAPR = (projectedMarketEarnings * WAD) / netPosition;

    const rewardsAPR = (projectedRewardsEarnings * WAD) / netPosition;

    const nativeAPR = (projectedNativeEarnings * WAD) / netPosition;

    const netAPR = marketAPR + rewardsAPR + nativeAPR;

    return {
      marketAPR,
      rewardsAPR,
      nativeAPR,
      netAPR,
      netPosition,
    };
  }, [
    accountData,
    borrowEvents,
    borrowEventsFetching,
    borrowEventsLoading,
    depositEvents,
    depositEventsFetching,
    depositEventsLoading,
    floatingBorrow,
    floatingDeposit,
    hasFixedBorrows,
    hasFixedDeposits,
    isFetching,
    rates,
    repayEvents,
    repayEventsFetching,
    repayEventsLoading,
    stETHNativeAPR,
    withdrawEvents,
    withdrawEventsFetching,
    withdrawEventsLoading,
  ]);
};
