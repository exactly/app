import { useContractReads } from 'wagmi';

import { interestRateModelABI } from 'types/abi';
import useAccountData from './useAccountData';
import { useWeb3 } from './useWeb3';

type IRMParameters = {
  naturalUtilization: bigint;
  sigmoidSpeed: bigint;
  growthSpeed: bigint;
  maxRate: bigint;

  spreadFactor: bigint;
  timePreference: bigint;
  fixedAllocation: bigint;
  maturitySpeed: bigint;
};

export default function useIRM(symbol: string): IRMParameters | undefined {
  const { chain } = useWeb3();
  const { marketAccount } = useAccountData(symbol);

  const irm = {
    abi: interestRateModelABI,
    address: marketAccount?.interestRateModel.id,
    chainId: chain.id,
  } as const;

  const { data: irmParams } = useContractReads({
    contracts: [
      {
        ...irm,
        functionName: 'naturalUtilization',
      },
      {
        ...irm,
        functionName: 'sigmoidSpeed',
      },
      {
        ...irm,
        functionName: 'growthSpeed',
      },
      {
        ...irm,
        functionName: 'maxRate',
      },
      {
        ...irm,
        functionName: 'spreadFactor',
      },
      {
        ...irm,
        functionName: 'timePreference',
      },
      {
        ...irm,
        functionName: 'fixedAllocation',
      },
      {
        ...irm,
        functionName: 'maturitySpeed',
      },
    ],
    allowFailure: false,
  });

  if (irmParams === undefined) {
    return undefined;
  }

  const [
    naturalUtilization,
    sigmoidSpeed,
    growthSpeed,
    maxRate,
    spreadFactor,
    timePreference,
    fixedAllocation,
    maturitySpeed,
  ] = irmParams as bigint[];

  return {
    naturalUtilization,
    sigmoidSpeed,
    growthSpeed,
    maxRate,
    spreadFactor,
    timePreference,
    fixedAllocation,
    maturitySpeed,
  };
}
