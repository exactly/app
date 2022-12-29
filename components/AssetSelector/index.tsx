import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';

import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import { Market } from 'types/Market';
import { Option } from 'react-dropdown';
import { AccountData } from 'types/AccountData';

import style from './style.module.scss';
import formatSymbol from 'utils/formatSymbol';

type Props = {
  title?: boolean;
  defaultAddress?: string;
  onChange?: (marketData: Market) => void;
};

function AssetSelector({ title, defaultAddress, onChange }: Props) {
  const { market, setMarket } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  const [allMarketsData, setAllMarketsData] = useState<Array<Market>>([]);

  const selectOptions = useMemo(() => {
    if (!accountData) return [];

    return formatMarkets(accountData);
  }, [accountData]);

  useEffect(() => {
    const defaultOption = selectOptions.find(({ value }) => value === defaultAddress);

    setMarket(defaultOption ?? selectOptions[0]);
  }, [defaultAddress, selectOptions, setMarket]);

  function formatMarkets(markets: AccountData) {
    const formattedMarkets = Object.keys(markets).map((marketName: string) => {
      const { assetSymbol, market: marketAddress, adjustFactor } = markets[marketName];

      const marketData: Market = {
        symbol: assetSymbol,
        name: assetSymbol,
        market: marketAddress,
        isListed: true,
        collateralFactor: parseFloat(formatFixed(adjustFactor, 18)),
      };

      setAllMarketsData((prevState) => [...prevState, marketData]);

      return {
        label: (
          <div className={style.labelContainer}>
            <Image
              src={`/img/assets/${marketData?.symbol}.svg`}
              alt={formatSymbol(marketData.symbol)}
              className={style.marketImage}
              width={24}
              height={24}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />{' '}
            <span className={style.marketName}>{formatSymbol(marketData.symbol)}</span>
          </div>
        ),
        value: marketData.market,
      };
    });

    return formattedMarkets;
  }

  const handleChange = useCallback(
    (option: Option) => {
      const marketData = allMarketsData.find(({ market: marketAddress }) => marketAddress === option.value);
      onChange && marketData && onChange(marketData);
      setMarket(option);
    },
    [allMarketsData, onChange, setMarket],
  );

  return (
    <section className={style.container}>
      {title && (
        <div className={style.titleContainer}>
          <p className={style.title}>Fixed Rate Pools</p>
          <Tooltip value="Fixed Rate Pools" />
        </div>
      )}
      <div className={style.selectContainer}>
        {(market && market.label && market.value && (
          <Select
            options={selectOptions}
            onChange={handleChange}
            placeholder={market ?? selectOptions[0]}
            value={market ?? selectOptions[0]}
          />
        )) || <Skeleton width={200} height={48} />}
      </div>
    </section>
  );
}

export default AssetSelector;
