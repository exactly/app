import { useEffect, useMemo, useState } from 'react';
import useAccountData from './useAccountData';
import { WEI_PER_ETHER } from 'utils/const';
import useDashboard from './useDashboard';
import { parseEther } from 'viem';
import { useWeb3 } from './useWeb3';
import fetchAccounts, { Account } from 'queries/fetchAccounts';
import useRewards from './useRewards';
import useStETHNativeAPR from './useStETHNativeAPR';

export default () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { walletAddress, subgraphURL } = useWeb3();
  const { accountData = [] } = useAccountData();
  const { floatingRows: floatingDeposit } = useDashboard('deposit');
  const { floatingRows: floatingBorrow } = useDashboard('borrow');
  const markets = useMemo(() => Object.values(accountData), [accountData]);
  const { rates } = useRewards();
  const stETHNativeAPR = useStETHNativeAPR();

  useEffect(() => {
    if (!subgraphURL || !walletAddress) return;
    fetchAccounts(subgraphURL, walletAddress).then(setAccounts);
  }, [subgraphURL, walletAddress]);

  const fixedDepositsAPRs = useMemo(() => {
    if (!accounts.length) return;
    const _fixedPositions = accounts
      .flatMap(({ market: { asset }, fixedPositions }) => fixedPositions.map((fp) => ({ ...fp, asset })))
      .filter(({ borrow }) => !borrow);
    return _fixedPositions.length
      ? _fixedPositions.reduce(
          (acc, { rate, asset, maturity }) => {
            acc[asset.toLowerCase() + maturity] = rate;
            return acc;
          },
          {} as Record<string, bigint>,
        )
      : undefined;
  }, [accounts]);

  const fixedBorrowsAPRs = useMemo(() => {
    if (!accounts.length) return;
    const _fixedPositions = accounts
      .flatMap(({ market: { asset }, fixedPositions }) => fixedPositions.map((fp) => ({ ...fp, asset })))
      .filter(({ borrow }) => borrow);
    return _fixedPositions.length
      ? _fixedPositions.reduce(
          (acc, { rate, asset, maturity }) => {
            acc[asset.toLowerCase() + maturity] = rate;
            return acc;
          },
          {} as Record<string, bigint>,
        )
      : undefined;
  }, [accounts]);

  const floatingDepositAPRs = useMemo(() => {
    if (!floatingDeposit[0].apr) return;
    return floatingDeposit.reduce(
      (acc, { symbol, apr }) => {
        acc[symbol] = parseEther(String(apr));
        return acc;
      },
      {} as Record<string, bigint>,
    );
  }, [floatingDeposit]);

  const floatingBorrowAPRs = useMemo(() => {
    if (!floatingBorrow[0].apr) return;
    return floatingBorrow.reduce(
      (acc, { symbol, apr }) => {
        acc[symbol] = parseEther(String(apr));
        return acc;
      },
      {} as Record<string, bigint>,
    );
  }, [floatingBorrow]);

  const totalFloatingDeposits = useMemo(
    () =>
      markets.reduce(
        (total, { floatingDepositAssets, decimals, usdPrice }) =>
          total + (floatingDepositAssets * usdPrice) / BigInt(10 ** decimals),
        0n,
      ),
    [markets],
  );

  const projectedFloatingDeposits = useMemo(() => {
    if (!floatingDepositAPRs) return 0n;
    return markets.reduce(
      (total, { assetSymbol, floatingDepositAssets, decimals, usdPrice }) =>
        total +
        (((floatingDepositAssets * usdPrice) / BigInt(10 ** decimals)) * (floatingDepositAPRs[assetSymbol] || 0n)) /
          WEI_PER_ETHER,
      0n,
    );
  }, [floatingDepositAPRs, markets]);

  const projectedFloatingDepositRewards = useMemo(() => {
    if (!floatingDepositAPRs) return 0n;
    return markets.reduce(
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
  }, [floatingDepositAPRs, markets, rates]);

  const projectedFloatingDepositNative = useMemo(() => {
    if (!floatingDepositAPRs) return 0n;
    return markets
      .filter(({ assetSymbol }) => assetSymbol === 'wstETH')
      .reduce(
        (total, { floatingDepositAssets, decimals, usdPrice }) =>
          total + (((floatingDepositAssets * usdPrice) / BigInt(10 ** decimals)) * stETHNativeAPR) / WEI_PER_ETHER,
        0n,
      );
  }, [floatingDepositAPRs, markets, stETHNativeAPR]);

  const totalFloatingBorrows = useMemo(
    () =>
      markets.reduce(
        (total, { floatingBorrowAssets, decimals, usdPrice }) =>
          total + (floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals),
        0n,
      ),
    [markets],
  );

  const projectedFloatingBorrows = useMemo(() => {
    if (!floatingBorrowAPRs) return 0n;
    return markets.reduce(
      (total, { assetSymbol, floatingBorrowAssets, decimals, usdPrice }) =>
        total +
        (((floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals)) * (floatingBorrowAPRs[assetSymbol] || 0n)) /
          WEI_PER_ETHER,
      0n,
    );
  }, [floatingBorrowAPRs, markets]);

  const projectedFloatingBorrowRewards = useMemo(() => {
    if (!floatingBorrowAPRs) return 0n;
    return markets.reduce(
      (total, { assetSymbol, floatingBorrowAssets, decimals, usdPrice }) =>
        total +
        rates[assetSymbol].reduce(
          (acc, { floatingDeposit: borrow }) =>
            acc + ((floatingBorrowAssets * usdPrice) / BigInt(10 ** decimals)) * borrow,
          0n,
        ) /
          WEI_PER_ETHER,
      0n,
    );
  }, [floatingBorrowAPRs, markets, rates]);

  const totalFixedDeposits = useMemo(
    () =>
      markets.reduce((total, { fixedDepositPositions, decimals, usdPrice }) => {
        const fixedPosition = fixedDepositPositions.reduce(
          (fixedAcc, { position: { principal } }) => fixedAcc + principal,
          0n,
        );
        return total + (fixedPosition * usdPrice) / BigInt(10 ** decimals);
      }, 0n),
    [markets],
  );

  const projectedFixedDeposits = useMemo(() => {
    if (!fixedDepositsAPRs) return 0n;
    return markets.reduce((total, { asset, fixedDepositPositions, decimals, usdPrice }) => {
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
  }, [fixedDepositsAPRs, markets]);

  const projectedFixedDepositNative = useMemo(() => {
    if (!fixedDepositsAPRs) return 0n;
    return markets
      .filter(({ assetSymbol }) => assetSymbol === 'wstETH')
      .reduce((total, { fixedDepositPositions, decimals, usdPrice }) => {
        const fixedPosition = fixedDepositPositions.reduce(
          (fixedAcc, { position: { principal } }) =>
            fixedAcc + (((principal * usdPrice) / BigInt(10 ** decimals)) * stETHNativeAPR) / WEI_PER_ETHER,
          0n,
        );
        return total + fixedPosition;
      }, 0n);
  }, [fixedDepositsAPRs, markets, stETHNativeAPR]);

  const totalFixedBorrows = useMemo(
    () =>
      markets.reduce((total, { fixedBorrowPositions, decimals, usdPrice }) => {
        const fixedPosition = fixedBorrowPositions.reduce(
          (fixedAcc, { position: { principal } }) => fixedAcc + principal,
          0n,
        );
        return total + (fixedPosition * usdPrice) / BigInt(10 ** decimals);
      }, 0n),
    [markets],
  );

  const projectedFixedBorrows = useMemo(() => {
    if (!fixedBorrowsAPRs) return 0n;
    return markets.reduce((total, { asset, fixedBorrowPositions, decimals, usdPrice }) => {
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
  }, [fixedBorrowsAPRs, markets]);

  const projectedFixedBorrowRewards = useMemo(() => {
    if (!fixedBorrowsAPRs) return 0n;
    return markets.reduce((total, { assetSymbol, fixedBorrowPositions, decimals, usdPrice }) => {
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
    }, 0n);
  }, [fixedBorrowsAPRs, markets, rates]);

  const netPosition = useMemo(
    () => totalFloatingDeposits + totalFixedDeposits - totalFloatingBorrows - totalFixedBorrows,
    [totalFixedBorrows, totalFixedDeposits, totalFloatingBorrows, totalFloatingDeposits],
  );

  const projectedMarketEarnings = useMemo(
    () => projectedFloatingDeposits + projectedFixedDeposits - projectedFloatingBorrows - projectedFixedBorrows,
    [projectedFixedBorrows, projectedFixedDeposits, projectedFloatingBorrows, projectedFloatingDeposits],
  );

  const projectedRewardsEarnings = useMemo(
    () => projectedFixedBorrowRewards + projectedFloatingBorrowRewards + projectedFloatingDepositRewards,
    [projectedFixedBorrowRewards, projectedFloatingBorrowRewards, projectedFloatingDepositRewards],
  );

  const projectedNativeEarnings = useMemo(
    () => projectedFixedDepositNative + projectedFloatingDepositNative,
    [projectedFixedDepositNative, projectedFloatingDepositNative],
  );

  const marketAPR = useMemo(() => {
    if (!netPosition) return 0n;
    return (projectedMarketEarnings * WEI_PER_ETHER) / netPosition;
  }, [projectedMarketEarnings, netPosition]);

  const rewardsAPR = useMemo(() => {
    if (!netPosition) return 0n;
    return (projectedRewardsEarnings * WEI_PER_ETHER) / netPosition;
  }, [projectedRewardsEarnings, netPosition]);

  const nativeAPR = useMemo(() => {
    if (!netPosition) return 0n;
    return (projectedNativeEarnings * WEI_PER_ETHER) / netPosition;
  }, [projectedNativeEarnings, netPosition]);

  const netAPR = useMemo(() => marketAPR + rewardsAPR + nativeAPR, [marketAPR, nativeAPR, rewardsAPR]);

  return {
    marketAPR,
    rewardsAPR,
    netAPR,
    netPosition,
  };
};
