import { useEffect, useState } from 'react';

import Select from 'components/common/Select';

import useContract from 'hooks/useContract';

import { getContractsByEnv } from 'utils/utils';
import assets from 'dictionary/assets.json';

import { Market } from 'types/Market';
import { Assets } from 'types/Assets';
import { UnformattedMarket } from 'types/UnformattedMarket';
import { Option } from 'react-dropdown';

import style from './style.module.scss';

type Props = {
  title?: Boolean;
};

function AssetSelector({ title }: Props) {
  const { auditor } = getContractsByEnv();
  const { contract } = useContract(auditor.address, auditor.abi);
  const [selectOptions, setSelectOptions] = useState<Array<Option>>([]);

  useEffect(() => {
    if (contract) {
      getMarkets();
    }
  }, [contract]);

  async function getMarkets() {
    const marketsAddresses = await contract?.getMarketAddresses();
    const marketsData: Array<UnformattedMarket> = [];

    marketsAddresses.map((address: string) => {
      return marketsData.push(contract?.getMarketData(address));
    });

    Promise.all(marketsData).then((data: Array<UnformattedMarket>) => {
      setSelectOptions(formatMarkets(data));
    });
  }

  function formatMarkets(markets: Array<UnformattedMarket>) {
    const formattedMarkets = markets.map((market: UnformattedMarket) => {
      const marketData: Market = {
        symbol: market[0],
        name: market[1],
        address: market[5],
        isListed: market[2],
        collateralFactor: market[4]
      };

      const symbol: keyof Market = marketData.symbol;
      const assetsData: Assets<symbol> = assets;
      const src: string = assetsData[symbol];

      return {
        label: (
          <div className={style.labelContainer}>
            <img
              src={src}
              alt={marketData.name}
              className={style.marketImage}
            />{' '}
            <span className={style.marketName}>{marketData.name}</span>
          </div>
        ),
        value: marketData.address
      };
    });

    return formattedMarkets;
  }

  function handleChange(option: any) {
    console.log(option, 2134);
  }

  return (
    <section className={style.container}>
      {title && <p className={style.title}>Maturity pool</p>}
      <div className={style.selectContainer}>
        <Select
          options={selectOptions}
          onChange={handleChange}
          placeholder={selectOptions[0]}
          value={selectOptions[0]}
        />
      </div>
    </section>
  );
}

export default AssetSelector;
