import { useEffect, useState, useContext } from 'react';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';

import { AddressContext } from 'contexts/AddressContext';
import AuditorContext from 'contexts/AuditorContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { Market } from 'types/Market';
import { UnformattedMarket } from 'types/UnformattedMarket';
import { Address } from 'types/Address';
import { Option } from 'react-dropdown';

import style from './style.module.scss';
import { getContractData } from 'utils/contracts';
import parseSymbol from 'utils/parseSymbol';

type Props = {
  title?: Boolean;
  defaultAddress?: String;
  onChange?: (marketData: Market) => void;
};

function AssetSelector({ title, defaultAddress, onChange }: Props) {
  const { address, setAddress } = useContext(AddressContext);
  const { network } = useWeb3Context();

  const auditorData = useContext(AuditorContext);

  const auditorContract = getContractData(network?.name, auditorData.address!, auditorData.abi!);
  const [selectOptions, setSelectOptions] = useState<Array<Option>>([]);
  const [allMarketsData, setAllMarketsData] = useState<Array<Market>>([]);

  useEffect(() => {
    if (auditorContract) {
      getMarkets();
    }
  }, []);

  async function getMarkets() {
    const marketsAddresses = await auditorContract?.getAllMarkets();
    const marketsData: Array<UnformattedMarket> = [];

    if (!marketsAddresses) {
      //in case the contract doesn't return any market data
      return;
    }

    marketsAddresses.map((address: string) => {
      return marketsData.push(auditorContract?.getMarketData(address));
    });

    Promise.all(marketsData).then((data: Array<UnformattedMarket>) => {
      const formattedMarkets = formatMarkets(data);
      setSelectOptions(formattedMarkets);

      const defaultOption = data?.find((market) => {
        return market[5] == defaultAddress;
      });

      const formatDefault = defaultOption && formatDefaultOption(defaultOption);
      setAddress(formatDefault ?? formattedMarkets[0]);
    });
  }

  function formatDefaultOption(market: UnformattedMarket) {
    const marketData: Market = {
      symbol: market[0],
      name: market[1],
      market: market[5],
      isListed: market[2],
      collateralFactor: market[4]
    };

    onChange && onChange(marketData);

    return {
      label: (
        <div className={style.labelContainer}>
          <img
            src={`/img/assets/${marketData?.symbol.toLowerCase()}.png`}
            alt={marketData.name}
            className={style.marketImage}
          />{' '}
          <span className={style.marketName}>{parseSymbol(marketData.name)}</span>
        </div>
      ),
      value: marketData.market
    };
  }

  function formatMarkets(markets: Array<UnformattedMarket>) {
    const formattedMarkets = markets.map((market: UnformattedMarket) => {
      const marketData: Market = {
        symbol: market[0],
        name: market[1],
        market: market[5],
        isListed: market[2],
        collateralFactor: market[4]
      };

      setAllMarketsData((prevState) => [...prevState, marketData]);

      return {
        label: (
          <div className={style.labelContainer}>
            <img
              src={`/img/assets/${marketData?.symbol.toLowerCase()}.png`}
              alt={parseSymbol(marketData.name)}
              className={style.marketImage}
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
    const marketData = allMarketsData.find((market) => market.address == address);

    onChange && marketData && onChange(marketData);
  }

  function handleChange(option: Address) {
    getDataByAddress(option.value);
    setAddress(option);
  }

  return (
    <section className={style.container}>
      {title && (
        <div className={style.titleContainer}>
          <p className={style.title}>Maturity Pool</p>
          <Tooltip value="Maturity Pool" />
        </div>
      )}
      <div className={style.selectContainer}>
        <Select
          options={selectOptions}
          onChange={handleChange}
          placeholder={address ?? selectOptions[0]}
          value={address ?? selectOptions[0]}
        />
      </div>
    </section>
  );
}

export default AssetSelector;
