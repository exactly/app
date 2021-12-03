import { useEffect, useState } from 'react';

import Select from 'components/common/Select';

import useContract from 'hooks/useContract';

import { getContractsByEnv } from 'utils/utils';
import assets from 'dictionary/assets.json';

import { Market } from 'types/Market';
import { Assets } from 'types/Assets';
import { UnformatedMarket } from 'types/UnformattedMarket';

import style from './style.module.scss';

type Props = {
  title?: Boolean;
};

function AssetSelector({ title }: Props) {
  const { auditor } = getContractsByEnv();
  const { contract } = useContract(auditor.address, auditor.abi);
  const [markets, setMarkets] = useState<Array<any>>([]);

  useEffect(() => {
    if (contract) {
      getMarkets();
    }
  }, [contract]);

  async function getMarkets() {
    const marketsAddresses = await contract?.getMarketAddresses();
    const marketsParsed = marketsAddresses.map(async (address: string) => {
      const marketData = await contract?.getMarketData(address);
      return { ...marketData, address };
    });

    Promise.all(marketsParsed).then((data: Array<any>) => {
      setMarkets(formatMarkets(data));
    });
  }

  function formatMarkets(markets: Array<UnformatedMarket>) {
    const formattedMarkets = markets.map((market: UnformatedMarket) => {
      const symbol: keyof Market = market[0];
      const assetsData: Assets<symbol> = assets;
      const src: string = assetsData[symbol];

      return {
        label: (
          <div className={style.labelContainer}>
            <img src={src} alt={market[1]} className={style.marketImage} />{' '}
            <span className={style.marketName}>{market[1]}</span>
          </div>
        ),
        value: market.address
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
          options={markets}
          onChange={handleChange}
          placeholder={markets[0]}
          value={markets[0]}
        />
      </div>
    </section>
  );
}

export default AssetSelector;
