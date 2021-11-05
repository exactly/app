import { useState, useEffect, useRef, useContext } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import { ethers } from "ethers";

import MarketsList from "components/MarketsList";
import MaturitySelector from "components/MaturitySelector";
import Modal from "components/Modal";
import Navbar from "components/Navbar";

import useContract from "hooks/useContract";
import useModal from "hooks/useModal";
import useOnClickOutside from "hooks/useOnClickOutside";

import ContractContext from "contexts/ContractContext";

import { Market } from "types/Market";

const Home: NextPage = () => {
  const { modal, handleModal, modalContent } = useModal();
  const ref = useRef<HTMLInputElement>(null);
  useOnClickOutside(ref, () => handleModal({}));
  const contracts = useContext(ContractContext);

  const [markets, setMarkets] = useState<Array<Market>>([]);
  const { contract } = useContract(
    contracts.auditor?.address,
    contracts.auditor?.abi
  );

  useEffect(() => {
    if (contract) {
      getMarkets();
    }
  }, [contract]);

  async function getMarkets() {
    const marketsAddresses = await contract?.getMarketAddresses();

    const marketsParsed = marketsAddresses.map(async (address: string) => {
      const marketData = await contract?.markets(address);
      return { ...marketData, address };
    });

    Promise.all(marketsParsed).then((data: Array<any>) => {
      setMarkets(formatMarkets(data));
    });
  }

  function formatMarkets(markets: any) {
    const length = markets.length;

    let formattedMarkets: Array<Market> = [];

    for (let i = 0; i < length; i++) {
      const market: Market = {
        address: "",
        symbol: "",
        name: "",
        isListed: false,
        collateralFactor: 0
      };

      market["address"] = markets[i].address;
      market["symbol"] = markets[i].symbol;
      market["name"] = markets[i][0];
      market["isListed"] = markets[i].isListed;
      market["collateralFactor"] = parseFloat(
        ethers.utils.formatEther(markets[i].collateralFactor)
      );

      formattedMarkets = [...formattedMarkets, market];
    }

    return formattedMarkets;
  }

  function showModal(address: Market["address"]) {
    const data = markets.find((market) => {
      return market.address === address;
    });
    handleModal({ content: data });
  }

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
        <link rel="icon" href="/icon.ico" />
      </Head>
      {modal && (
        <div ref={ref}>
          <Modal contractData={modalContent} />
        </div>
      )}
      <Navbar />
      <MaturitySelector />
      <MarketsList markets={markets} showModal={showModal} />
    </div>
  );
};

export default Home;
