import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

const YEAR_IN_SECONDS = 60n * 60n * 24n * 365n;

import { Hex } from 'viem';

export function formatWallet(walletAddress?: string) {
  if (!walletAddress) return '';
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}

export function formatTx(hash: Hex): string {
  return `${hash.substring(0, 6)}...${hash.substring(48)}`;
}

export function formatHex(hex: Hex): string {
  return `${hex.substring(0, 8)}...${hex.substring(hex.length - 16)}`;
}

export const toPercentage = (value?: number, fractionDigits = 2): string => {
  if (value != null) {
    return value.toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  return 'N/A';
};

export const checkPrecision = (value: string, decimals?: number): boolean => {
  const regex = new RegExp(`^\\d*(.\\d{1,${decimals ?? 18}})?$`, 'g');
  return regex.test(value);
};

export const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;

export const aprToAPY = (apr: bigint, interval: bigint) => {
  const compounds = YEAR_IN_SECONDS / interval;
  return (WAD + apr / compounds) ** compounds / WAD ** (compounds - 1n) - WAD;
};
