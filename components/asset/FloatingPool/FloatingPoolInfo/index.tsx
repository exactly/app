import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { formatEther, formatUnits } from '@ethersproject/units';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';
import { PoolItemInfoProps } from 'components/asset/PoolItemInfo';
import PoolHeaderInfo from 'components/asset/PoolHeaderInfo';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import parseSymbol from 'utils/parseSymbol';
import formatNumber from 'utils/formatNumber';
import queryRates from 'utils/queryRates';
import getSubgraph from 'utils/getSubgraph';

type FloatingPoolInfoProps = {
  symbol: string;
  eMarketAddress?: string;
  networkName: string;
};

const FloatingPoolInfo: FC<FloatingPoolInfoProps> = ({ symbol, eMarketAddress, networkName }) => {
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [supply, setSupply] = useState<number | undefined>(undefined);
  const [demand, setDemand] = useState<number | undefined>(undefined);
  const [depositAPR, setDepositAPR] = useState<string | undefined>(undefined);
  const [borrowAPR, setBorrowAPR] = useState<string | undefined>(undefined);
  const subgraphUrl = getSubgraph(networkName);

  const fetchPoolData = useCallback(async () => {
    if (!accountData || !symbol) return;

    try {
      const {
        totalFloatingBorrowAssets: borrowed,
        totalFloatingDepositAssets: supplied,
        decimals,
        oraclePrice
      } = accountData[parseSymbol(symbol)];
      const exchangeRate = parseFloat(formatEther(oraclePrice));

      setSupply(parseFloat(formatUnits(supplied, decimals)) * exchangeRate);
      setDemand(parseFloat(formatUnits(borrowed, decimals)) * exchangeRate);
    } catch (e) {
      console.log(e);
    }
  }, [accountData, symbol]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  const fetchAPRs = useCallback(async () => {
    if (!accountData || !eMarketAddress) return;
    const maxFuturePools = accountData[symbol.toUpperCase()].maxFuturePools;

    // TODO: consider storing these results in a new context so it's only fetched once - already added in tech debt docs
    const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, eMarketAddress, 'deposit', {
      maxFuturePools
    });
    const [{ apr: borrowAPRRate }] = await queryRates(subgraphUrl, eMarketAddress, 'borrow');
    setDepositAPR(`${(depositAPRRate * 100).toFixed(2)}%`);

    setBorrowAPR(`${(borrowAPRRate * 100).toFixed(2)}%`);
  }, [accountData, eMarketAddress, symbol, subgraphUrl]);

  useEffect(() => {
    fetchAPRs();
  }, [fetchAPRs]);

  const itemsInfo: PoolItemInfoProps[] = [
    {
      label: translations[lang].totalDeposited,
      value: supply ? formatNumber(supply, symbol) : undefined
    },
    {
      label: translations[lang].totalBorrowed,
      value: demand ? formatNumber(demand, symbol) : undefined
    },
    {
      label: translations[lang].TVL,
      value: supply && demand ? formatNumber(supply - demand, symbol) : undefined
    },
    {
      label: translations[lang].depositAPR,
      value: depositAPR
    },
    {
      label: translations[lang].borrowAPR,
      value: borrowAPR
    },
    {
      label: translations[lang].utilizationRate,
      value: supply && demand ? `${((demand / supply) * 100).toFixed(2)}%` : undefined
    }
  ];

  return <PoolHeaderInfo title={translations[lang].smartPool} itemsInfo={itemsInfo} />;
};

export default FloatingPoolInfo;
