import { useState, useEffect, useRef, useContext } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import { ethers } from "ethers";

import MarketsList from "components/MarketsList";
import Navbar from "components/Navbar";

import useContract from "hooks/useContract";
import useModal from "hooks/useModal";
import useOnClickOutside from "hooks/useOnClickOutside";

import ContractContext from "contexts/ContractContext";

import { Market } from "types/Market";
import Modal from "components/Modal";

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
    const marketsData = await contract?.getMarkets();

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
        collateralFactor: 0
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

  function showModal(address: Market["address"]) {
    handleModal({ content: address });
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
          <Modal address={modalContent} />
        </div>
      )}
      <Navbar />
      <MarketsList markets={markets} showModal={showModal} />
    </div>
  );
};

export default Home;
