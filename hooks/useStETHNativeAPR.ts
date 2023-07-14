import { useEffect, useState } from 'react';
import { parseEther } from 'viem';

type LidoResponse = {
  data: {
    timeUnix: number;
    apr: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
};

export default function useStETHNativeAPR(): bigint {
  const [apr, set] = useState<bigint>(0n);

  useEffect(() => {
    (async () => {
      const response = (await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/last').then((res) =>
        res.json(),
      )) as LidoResponse;

      set(parseEther(String(response.data.apr)));
    })();
  }, []);

  return apr;
}
