import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

import Breadcrumb from "components/common/Breadcrumb";
import SupplyForm from "components/SupplyForm";
import Navbar from "components/Navbar";

import useContractWithSigner from "hooks/useContractWithSigner";

import ContractContext from "contexts/ContractContext";

import { Market } from "types/Market";
import { SupplyRate } from "types/SupplyRate";

import style from "./style.module.scss";

type Props = {
  address: string;
};

function Exafin({ address }: Props) {
  const contracts = useContext(ContractContext);

  const [potentialRate, setPotentialRate] = useState<string | undefined>(
    undefined
  );
  const [poolSupply, setPoolSupply] = useState<string | undefined>(undefined);
  const [poolLend, setPoolLend] = useState<string | undefined>(undefined);

  const [exafinData, setExafinData] = useState<Market | undefined>(undefined);
  const [hasRate, setHasRate] = useState<boolean>(false);

  const { contractWithSigner } = useContractWithSigner(
    address,
    contracts?.exafin?.abi
  );

  console.log({ contractWithSigner });

  const exaFrontContract = useContractWithSigner(
    contracts?.exaFront?.address,
    contracts?.exaFront?.abi
  );

  console.log({ exaFrontContract });

  useEffect(() => {
    if (exaFrontContract.contractWithSigner) {
      getMarketByAddress(address);
    }
  }, [exaFrontContract.contractWithSigner]);

  // useEffect(() => {
  //   if (contractWithSigner) {
  //     getNextMonth();
  //   }
  // }, [contractWithSigner]);

  // async function getNextMonth() {
  //   const now = Math.floor(Date.now() / 1000);
  //   const oneDay: number = 86400;
  //   const thirtyDays: number = 86400 * 30;

  //   const nextMonth = now + thirtyDays;

  //   const test = await contractWithSigner?.rateForSupply(
  //     ethers.utils.parseUnits("0.00000001"),
  //     nextMonth
  //   );
  // }

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
      name
    };
    console.log(formattedMarketData, 1234);
    setExafinData(formattedMarketData);
  }

  function handleResult(data: SupplyRate) {
    setHasRate(true);
    setPotentialRate(data.potentialRate);
    setPoolSupply(data.poolSupply);
    setPoolLend(data.poolLend);
  }

  return (
    <div>
      <Navbar />
      <section className={style.container}>
        <Breadcrumb
          steps={[
            {
              value: exafinData?.symbol,
              url: `/markets/${exafinData?.address}`
            }
          ]}
        />
        {exafinData?.name && (
          <h1>
            {exafinData.name}{" "}
            {exafinData?.symbol && <>({exafinData?.symbol})</>}
          </h1>
        )}

        <section className={style.dataContainer}>
          <section className={style.left}>
            <SupplyForm
              contractWithSigner={contractWithSigner!}
              handleResult={handleResult}
              hasRate={hasRate}
            />
          </section>
          {hasRate && (
            <section className={style.right}>
              <p>
                Tu interes anual es de: <strong>{potentialRate}</strong>
              </p>
              <p>
                Despues de tu deposito la pool va a tener{" "}
                <strong>
                  {poolSupply} {exafinData?.symbol}
                </strong>
              </p>
              <p>
                Despues de tu deposito la pool va a haber prestado{" "}
                <strong>
                  {poolLend} {exafinData?.symbol}
                </strong>
              </p>
            </section>
          )}
        </section>
      </section>
    </div>
  );
}

export async function getServerSideProps({ query }: any) {
  const { address } = query;

  return {
    props: {
      address
    }
  };
}

export default Exafin;
