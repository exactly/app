import { useContext, useState, useEffect, useRef } from "react";
import style from "./style.module.scss";

import SupplyForm from "components/SupplyForm";

import useContractWithSigner from "hooks/useContractWithSigner";

import ContractContext from "contexts/ContractContext";

import { Market } from "types/Market";
import { SupplyRate } from "types/SupplyRate";

import dictionary from "../../dictionary/en.json";

type Props = {
  address: any;
};

function Modal({ address }: Props) {
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

  const exaFrontContract = useContractWithSigner(
    contracts?.exaFront?.address,
    contracts?.exaFront?.abi
  );

  useEffect(() => {
    if (exaFrontContract.contractWithSigner) {
      getMarketByAddress(address);
    }
  }, [exaFrontContract.contractWithSigner]);

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

    setExafinData(formattedMarketData);
  }

  function handleResult(data: SupplyRate) {
    setHasRate(true);
    setPotentialRate(data.potentialRate);
    setPoolSupply(data.poolSupply);
    setPoolLend(data.poolLend);
  }

  return (
    <div className={style.modal}>
      <p>{exafinData?.symbol}</p>
      <SupplyForm
        contractWithSigner={contractWithSigner!}
        handleResult={handleResult}
        hasRate={hasRate}
      />
      {hasRate && (
        <section className={style.right}>
          <p>
            {dictionary.annualRate}: <strong>{potentialRate}</strong>
          </p>
          <p>
            {dictionary.supply}{" "}
            <strong>
              {poolSupply} {exafinData?.symbol}
            </strong>
          </p>
          <p>
            {dictionary.lend}{" "}
            <strong>
              {poolLend} {exafinData?.symbol}
            </strong>
          </p>
        </section>
      )}
    </div>
  );
}

export default Modal;
