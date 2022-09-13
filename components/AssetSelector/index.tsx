import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';

import { MarketContext } from 'contexts/AddressContext';
import PreviewerContext from 'contexts/PreviewerContext';
import ContractsContext from 'contexts/ContractsContext';

import { Market } from 'types/Market';
import { Address } from 'types/Address';
import { Option } from 'react-dropdown';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import style from './style.module.scss';
import parseSymbol from 'utils/parseSymbol';
import Skeleton from 'react-loading-skeleton';

type Props = {
  title?: Boolean;
  defaultAddress: string | undefined;
  onChange?: (marketData: Market) => void;
};

function AssetSelector({ title, defaultAddress, onChange }: Props) {
  const previewerData = useContext(PreviewerContext);
  const { market, setMarket } = useContext(MarketContext);
  const { getInstance } = useContext(ContractsContext);

  const [selectOptions, setSelectOptions] = useState<Array<Option>>([]);
  const [allMarketsData, setAllMarketsData] = useState<Array<Market>>([]);

  useEffect(() => {
    if (previewerData) {
      getMarkets();
    }
  }, [previewerData, defaultAddress]);

  async function getMarkets() {
    try {
      //this call is not needed we can remove it and consume directly accountData from the context
      const previewerContract = getInstance(
        previewerData.address!,
        previewerData.abi!,
        'previewer'
      );

      const marketsData = await previewerContract?.exactly(
        '0x000000000000000000000000000000000000dEaD'
      );

      if (!marketsData) {
        //in case the contract doesn't return any market data
        return;
      }

      const formattedMarkets = formatMarkets(marketsData);

      setSelectOptions(formattedMarkets);

      const defaultOption = formattedMarkets?.find((market: Option) => {
        return market.value == defaultAddress;
      });

      setMarket(defaultOption ?? formattedMarkets[0]);
    } catch (e) {
      console.log(e);
    }
  }

  function formatMarkets(markets: Array<FixedLenderAccountData>) {
    const formattedMarkets = markets.map((market: FixedLenderAccountData) => {
      const marketData: Market = {
        symbol: market.assetSymbol,
        name: market.assetSymbol,
        market: market.market,
        isListed: true,
        collateralFactor: parseFloat(ethers.utils.formatEther(market.adjustFactor))
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
