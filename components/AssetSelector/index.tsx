import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';

import { AddressContext } from 'contexts/AddressContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';

import { Market } from 'types/Market';
import { Address } from 'types/Address';
import { Option } from 'react-dropdown';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import style from './style.module.scss';
import { getContractData } from 'utils/contracts';
import parseSymbol from 'utils/parseSymbol';

type Props = {
  title?: Boolean;
  defaultAddress?: String;
  onChange?: (marketData: Market) => void;
};

function AssetSelector({ title, defaultAddress, onChange }: Props) {
  const previewerData = useContext(PreviewerContext);

  const { address, setAddress } = useContext(AddressContext);
  const { network } = useWeb3Context();

  const [selectOptions, setSelectOptions] = useState<Array<Option>>([]);
  const [allMarketsData, setAllMarketsData] = useState<Array<Market>>([]);

  useEffect(() => {
    if (previewerData) {
      getMarkets();
    }
  }, [previewerData]);

  async function getMarkets() {
    try {
      const previewerContract = getContractData(
        network?.name!,
        previewerData.address!,
        previewerData.abi!
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

      setAddress(defaultOption ?? formattedMarkets[0]);
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
    const marketData = allMarketsData.find((market) => market.market == address);
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
          <p className={style.title}>Fixed Rate Pools</p>
          <Tooltip value="Fixed Rate Pools" />
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
