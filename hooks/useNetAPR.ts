import { useEffect, useMemo, useState } from 'react';
import useAccountData from './useAccountData';
import { WEI_PER_ETHER } from 'utils/const';
import useDashboard from './useDashboard';
import { parseEther } from 'viem';
import { useWeb3 } from './useWeb3';
import fetchAccounts, { Account } from 'queries/fetchAccounts';
import useRewards from './useRewards';
import useStETHNativeAPR from './useStETHNativeAPR';
import dayjs from 'dayjs';

export default () => {
  const [accounts, setAccounts] = useState<Account[] | undefined>();
  const { walletAddress, subgraphURL } = useWeb3();
  const { accountData, isFetching } = useAccountData();
  const { floatingRows: floatingDeposit } = useDashboard('deposit');
  const { floatingRows: floatingBorrow } = useDashboard('borrow');
  const stETHNativeAPR = useStETHNativeAPR();
  const { rates } = useRewards();

  useEffect(() => {
    if (!subgraphURL || !walletAddress) return;
    fetchAccounts(subgraphURL, walletAddress).then(setAccounts);
  }, [subgraphURL, walletAddress]);

  return useMemo(() => {
    if (!accountData || !accounts || isFetching || !floatingDeposit[0].apr || !floatingBorrow[0].apr) return {};

    const markets = Object.values(accountData);
    const now = dayjs().unix();

    const _fixedPositions = accounts.flatMap(({ market: { asset }, fixedPositions }) =>
      fixedPositions.map((fp) => ({ ...fp, asset })),
    );

    const fixedDepositsAPRs = _fixedPositions
      .filter(({ borrow }) => !borrow)
      .reduce(
        (acc, { rate, asset, maturity }) => {
          acc[asset.toLowerCase() + maturity] = maturity < now ? 0n : rate;
          return acc;
        },
        {} as Record<string, bigint>,
      );

    const fixedBorrowsAPRs = _fixedPositions
      .filter(({ borrow }) => borrow)
      .reduce(
        (acc, { rate, asset, maturity }) => {
          acc[asset.toLowerCase() + maturity] = maturity < now ? 0n : rate;
          return acc;
        },
        {} as Record<string, bigint>,
      );

    const floatingDepositAPRs = floatingDeposit.reduce(
      (acc, { symbol, apr }) => {
        acc[symbol] = parseEther(String(apr));
        return acc;
      },
      {} as Record<string, bigint>,
    );

    const floatingBorrowAPRs = floatingBorrow.reduce(
      (acc, { symbol, apr }) => {
        acc[symbol] = parseEther(String(apr));
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
          WEI_PER_ETHER,
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
          WEI_PER_ETHER,
      0n,
    );

    const projectedFloatingDepositNative = markets
      .filter(({ assetSymbol }) => assetSymbol === 'wstETH')
      .reduce(
        (total, { floatingDepositAssets, decimals, usdPrice }) =>
          total + (((floatingDepositAssets * usdPrice) / BigInt(10 ** decimals)) * stETHNativeAPR) / WEI_PER_ETHER,
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
        (((floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals)) * (floatingBorrowAPRs[assetSymbol] || 0n)) /
          WEI_PER_ETHER,
      0n,
    );

    const projectedFloatingBorrowRewards = markets.reduce(
      (total, { assetSymbol, floatingBorrowAssets, decimals, usdPrice }) =>
        total +
        rates[assetSymbol].reduce(
          (acc, { borrow }) => acc + ((floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals)) * borrow,
          0n,
        ) /
          WEI_PER_ETHER,
      0n,
    );

    const totalFixedDeposits = markets.reduce((total, { fixedDepositPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedDepositPositions.reduce(
        (fixedAcc, { position: { principal } }) => fixedAcc + principal,
        0n,
      );
      return total + (fixedPosition * usdPrice) / BigInt(10 ** decimals);
    }, 0n);

    const projectedFixedDeposits = markets.reduce((total, { asset, fixedDepositPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedDepositPositions.reduce(
        (fixedAcc, { position: { principal }, maturity }) =>
          fixedAcc +
          (((principal * usdPrice) / BigInt(10 ** decimals)) *
            (fixedDepositsAPRs[asset.toLowerCase() + maturity] || 0n)) /
            WEI_PER_ETHER,
        0n,
      );
      return total + fixedPosition;
    }, 0n);

    const projectedFixedDepositNative = markets
      .filter(({ assetSymbol }) => assetSymbol === 'wstETH')
      .reduce((total, { fixedDepositPositions, decimals, usdPrice }) => {
        const fixedPosition = fixedDepositPositions.reduce(
          (fixedAcc, { position: { principal } }) =>
            fixedAcc + (((principal * usdPrice) / BigInt(10 ** decimals)) * stETHNativeAPR) / WEI_PER_ETHER,
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

    const projectedFixedBorrows = markets.reduce((total, { asset, fixedBorrowPositions, decimals, usdPrice }) => {
      const fixedPosition = fixedBorrowPositions.reduce(
        (fixedAcc, { position: { principal }, maturity }) =>
          fixedAcc +
          (((principal * usdPrice) / BigInt(10 ** decimals)) *
            (fixedBorrowsAPRs[asset.toLowerCase() + maturity] || 0n)) /
            WEI_PER_ETHER,
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
              WEI_PER_ETHER,
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

    const marketAPR = (projectedMarketEarnings * WEI_PER_ETHER) / netPosition;

    const rewardsAPR = (projectedRewardsEarnings * WEI_PER_ETHER) / netPosition;

    const nativeAPR = (projectedNativeEarnings * WEI_PER_ETHER) / netPosition;

    const netAPR = marketAPR + rewardsAPR + nativeAPR;

    return {
      marketAPR,
      rewardsAPR,
      nativeAPR,
      netAPR,
      netPosition,
    };
  }, [accountData, accounts, floatingBorrow, floatingDeposit, isFetching, rates, stETHNativeAPR]);
};
