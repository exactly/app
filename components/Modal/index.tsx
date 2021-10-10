import { useContext, useState, useEffect } from "react";
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

  const [auditorData, setAuditorData] = useState<Market | undefined>(undefined);
  const [hasRate, setHasRate] = useState<boolean>(false);

  const { contractWithSigner } = useContractWithSigner(
    address,
    contracts?.auditor?.abi
  );

  const auditorContract = useContractWithSigner(
    contracts?.auditor?.address,
    contracts?.auditor?.abi
  );

  useEffect(() => {
    if (auditorContract.contractWithSigner) {
      getMarketByAddress(address);
    }
  }, [auditorContract.contractWithSigner]);

  async function getMarketByAddress(contractAddress: string) {
    const [address, symbol, isListed, collateralFactor, name] =
      await auditorContract?.contractWithSigner?.getMarketByAddress(
        contractAddress
      );
    const formattedMarketData: Market = {
      address,
      symbol,
      isListed,
      collateralFactor,
      name
    };

    setAuditorData(formattedMarketData);
  }

  function handleResult(data: SupplyRate) {
    setHasRate(true);
    setPotentialRate(data.potentialRate);
    setPoolSupply(data.poolSupply);
    setPoolLend(data.poolLend);
  }

  return (
    <div className={style.modal}>
      <p>{auditorData?.symbol}</p>
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
              {poolSupply} {auditorData?.symbol}
            </strong>
          </p>
          <p>
            {dictionary.lend}{" "}
            <strong>
              {poolLend} {auditorData?.symbol}
            </strong>
          </p>
        </section>
      )}
    </div>
  );
}

export default Modal;
