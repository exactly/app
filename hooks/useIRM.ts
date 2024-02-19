import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { useMemo } from 'react';

import { interestRateModelABI } from 'types/abi';
import { WAD, expWad, lnWad } from 'utils/fixedMath';
import useAccountData from './useAccountData';

export type IRMParameters = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof interestRateModelABI, 'parameters'>['outputs']
>[number] & { A: bigint; B: bigint };

export default function useIRM(symbol: string): IRMParameters | undefined {
  const { marketAccount } = useAccountData(symbol);
  const {
    parameters: {
      minRate,
      naturalRate,
      maxUtilization,
      naturalUtilization,
      growthSpeed,
      sigmoidSpeed,
      spreadFactor,
      maturitySpeed,
      timePreference,
      fixedAllocation,
      maxRate,
    },
  } = marketAccount?.interestRateModel ?? { parameters: {} };

  return useMemo(() => {
    if (
      minRate === undefined ||
      naturalRate === undefined ||
      maxUtilization === undefined ||
      naturalUtilization === undefined ||
      growthSpeed === undefined ||
      sigmoidSpeed === undefined ||
      spreadFactor === undefined ||
      maturitySpeed === undefined ||
      timePreference === undefined ||
      fixedAllocation === undefined ||
      maxRate === undefined
    ) {
      return undefined;
    }
    const A =
      (((naturalRate * expWad((growthSpeed * lnWad(WAD - naturalUtilization / 2n)) / WAD)) / WAD - minRate) *
        (maxUtilization - naturalUtilization) *
        maxUtilization) /
      (naturalUtilization * WAD);
    const B = minRate - (A * WAD) / maxUtilization;
    return {
      minRate,
      naturalRate,
      maxUtilization,
      naturalUtilization,
      growthSpeed,
      sigmoidSpeed,
      spreadFactor,
      maturitySpeed,
      timePreference,
      fixedAllocation,
      maxRate,
      A,
      B,
    } as const;
  }, [
    minRate,
    naturalRate,
    maxUtilization,
    naturalUtilization,
    growthSpeed,
    sigmoidSpeed,
    spreadFactor,
    maturitySpeed,
    timePreference,
    fixedAllocation,
    maxRate,
  ]);
}
