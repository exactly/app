import React, { useState, useEffect, ChangeEventHandler } from "react";

import CurrentNetwork from "components/CurrentNetwork";
import Input from "components/common/Input";

import useContract from "hooks/useContract";

import exafin from "contracts/exafin.json";
import exaFrontContractData from "contracts/exaFront.json";

import style from "./style.module.scss";
import { Market } from "types/Market";
import { ethers } from "ethers";

type Props = {
  address: string;
};

function Exafin({ address }: Props) {
  const [exafinData, setExafinData] = useState<Market | undefined>(undefined);

  const { contractWithSigner } = useContract(address, exafin.abi);

  const exaFrontContract = useContract(
    exaFrontContractData?.address,
    exaFrontContractData?.abi
  );

  useEffect(() => {
    if (exaFrontContract.contractWithSigner) {
      getMarketByAddress(address);
    }
  }, [exaFrontContract.contractWithSigner]);

  useEffect(() => {
    if (contractWithSigner) {
      getNextMonth();
    }
  }, [contractWithSigner]);

  async function getNextMonth() {
    const now = Math.floor(Date.now() / 1000);
    const oneDay: number = 86400;
    const thirtyDays: number = 86400 * 30;

    const nextMonth = now + thirtyDays;

    const test = await contractWithSigner?.rateForSupply(
      ethers.utils.parseUnits("0.00000001"),
      nextMonth
    );

    console.log(ethers.utils.formatEther(test[0]));
    console.log(ethers.utils.formatEther(test[1][1]));
  }

  async function getMarketByAddress(contractAddress: string) {
    const [address, symbol, isListed, collateralFactor, name] =
      await exaFrontContract?.contractWithSigner?.getMarketByAddress(
        contractAddress
      );
    const formattedMarketData: Market = {
      address,
      symbol,
      isListed,
      collateralFactor,
      name,
    };

    setExafinData(formattedMarketData);
  }

  function handleDate(e: React.ChangeEvent<HTMLInputElement>) {
    console.log(Math.floor(Date.parse(e.target.value) / 1000));
  }
  return (
    <div>
      <CurrentNetwork />
      <section className={style.container}>
        <h1>
          {exafinData?.name} ({exafinData?.symbol})
        </h1>

        <section>
          <div className={style.fieldContainer}>
            <span>Cantidad a depositar</span>
            <div className={style.inputContainer}>
              <Input type="number" />
            </div>
          </div>
          <div className={style.fieldContainer}>
            <span>Fecha de fin</span>
            <div className={style.inputContainer}>
              <Input type="date" onChange={handleDate} />
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

export async function getServerSideProps({ query }: any) {
  const { address } = query;

  return {
    props: {
      address,
    },
  };
}

export default Exafin;
