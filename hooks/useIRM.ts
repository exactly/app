import { useContractReads } from 'wagmi';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';

import { interestRateModelABI } from 'types/abi';
import { WAD, expWad, lnWad } from 'utils/fixedMath';
import useAccountData from './useAccountData';

export type IRMParameters = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof interestRateModelABI, 'parameters'>['outputs']
>[number] & { A: bigint; B: bigint };

export default function useIRM(symbol: string): IRMParameters | undefined {
  const { marketAccount } = useAccountData(symbol);

  if (marketAccount === undefined) {
    return undefined;
  }

  const { parameters: p } = marketAccount.interestRateModel;

  const A =
    (((p.naturalRate * expWad((p.growthSpeed * lnWad(WAD - p.naturalUtilization / 2n)) / WAD)) / WAD - p.minRate) *
      (p.maxUtilization - p.naturalUtilization) *
      p.maxUtilization) /
    (p.naturalUtilization * WAD);
  const B = p.minRate - (A * WAD) / p.maxUtilization;

  return {
    ...p,
    A,
    B,
  } as const;
}
