import { useEffect, useState } from 'react';
import { useSigner } from 'wagmi';
import { Contract } from '@ethersproject/contracts';
import { MarketETHRouter } from 'types/contracts';
import MarketETHRouterABI from 'abi/MarketETHRouter.json';
import { captureException } from '@sentry/nextjs';
import { useWeb3 } from './useWeb3';

export default () => {
  const { data: signer } = useSigner();
  const { chain } = useWeb3();

  const [marketETHRouterContract, setMarketETHRouterContract] = useState<MarketETHRouter | undefined>(undefined);

  useEffect(() => {
    const loadMarketETHRouter = async () => {
      if (!chain?.id || !signer) return;

      const { address } = await import(
        `@exactly-protocol/protocol/deployments/${chain.name.toLowerCase()}/MarketETHRouter.json`,
        { assert: { type: 'json' } }
      );

      setMarketETHRouterContract(new Contract(address, MarketETHRouterABI, signer) as MarketETHRouter);
    };
    loadMarketETHRouter().catch(captureException);
  }, [chain?.id, chain?.name, signer]);

  return marketETHRouterContract;
};
