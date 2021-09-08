import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import { ethers } from "ethers";

import CurrentNetwork from "components/CurrentNetwork";
import MarketsList from "components/MarketsList";

import useContract from "hooks/useContract";

import exaFrontContract from "contracts/exaFront.json";

import { Market } from "types/Market";

const Home: NextPage = () => {
  const [markets, setMarkets] = useState<Array<Market>>([]);
  const { contract, contractWithSigner } = useContract(
    exaFrontContract?.address,
    exaFrontContract?.abi
  );

  useEffect(() => {
    if (contractWithSigner) {
      getMarkets();
    }
  }, [contractWithSigner]);

  async function getMarkets() {
    const marketsData = await contractWithSigner?.getMarkets();
    setMarkets(formatMarkets(marketsData));
  }

  function formatMarkets(markets: Array<Array<any>>) {
    const [addresses, symbols, areListed, collateralFactors, names] = markets;
    const length = addresses.length;

    let formattedMarkets: Array<Market> = [];

    for (let i = 0; i < length; i++) {
      const market: Market = {
        address: "",
        symbol: "",
        name: "",
        isListed: false,
        collateralFactor: 0,
      };

      market["address"] = addresses[i];
      market["symbol"] = symbols[i];
      market["name"] = names[i];
      market["isListed"] = areListed[i];
      market["collateralFactor"] = parseFloat(
        ethers.utils.formatEther(collateralFactors[i])
      );

      formattedMarkets = [...formattedMarkets, market];
    }

    return formattedMarkets;
  }

  // contractWithSigner?.enableMarket(
  //   "0x1c7B43a0bbab0a5EA0A1435F31D1c8e05Cc6aE98",
  //   2
  // );
  return (
    <div>
      <Head>
        <title>
          Exactly App - Fixed interest rates lending & borrowing protocol
        </title>
        <meta
          name="description"
          content="Exactly App - Fixed interest rates lending & borrowing protocol"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CurrentNetwork />
      <MarketsList markets={markets} />
    </div>
  );
};

export default Home;
