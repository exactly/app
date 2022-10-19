import { useState, useContext, useMemo, useEffect } from 'react';
import { utils } from 'ethers';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';

import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import { Market } from 'types/Market';
import { Address } from 'types/Address';
import { Option } from 'react-dropdown';
import { AccountData } from 'types/AccountData';

import style from './style.module.scss';
import parseSymbol from 'utils/parseSymbol';

type Props = {
  title?: Boolean;
  defaultAddress: string | undefined;
  onChange?: (marketData: Market) => void;
};

function AssetSelector({ title, defaultAddress, onChange }: Props) {
  const { market, setMarket } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  const [allMarketsData, setAllMarketsData] = useState<Array<Market>>([]);

  const selectOptions = useMemo(() => {
    return getMarkets();
  }, [accountData, defaultAddress]);

  useEffect(() => {
    const defaultOption = selectOptions?.find((market: Option) => {
      return market.value == defaultAddress;
    });

    setMarket(defaultOption ?? selectOptions[0]);
  }, [selectOptions]);

  function getMarkets() {
    if (!accountData) {
      return [];
    }

    const formattedMarkets = formatMarkets(accountData);

    return formattedMarkets;
  }

  function formatMarkets(markets: AccountData) {
    const formattedMarkets = Object.keys(markets).map((marketName: string) => {
      const market = markets[marketName];

      const marketData: Market = {
        symbol: market.assetSymbol,
        name: market.assetSymbol,
        market: market.market,
        isListed: true,
        collateralFactor: parseFloat(utils.formatEther(market.adjustFactor))
      };

      setAllMarketsData((prevState) => [...prevState, marketData]);

      return {
        label: (
          <div className={style.labelContainer}>
            <Image
              src={`/img/assets/${marketData?.symbol.toLowerCase()}.svg`}
              alt={parseSymbol(marketData.name)}
              className={style.marketImage}
              width={24}
              height={24}
            />{' '}
            <span className={style.marketName}>{parseSymbol(marketData.name)}</span>
          </div>
        ),
        value: marketData.market
      };
    });

    return formattedMarkets;
  }

  function getDataByAddress(address: string) {
    const marketData = allMarketsData.find((market) => market.market == address);
    onChange && marketData && onChange(marketData);
  }

  function handleChange(option: Address) {
    getDataByAddress(option.value);
    setMarket(option);
  }

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
