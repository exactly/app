import { useContext, useState } from "react";
import style from "./style.module.scss";

import SupplyForm from "components/SupplyForm";

import useContractWithSigner from "hooks/useContractWithSigner";

import ContractContext from "contexts/ContractContext";

import { Market } from "types/Market";
import { SupplyRate } from "types/SupplyRate";

import dictionary from "../../dictionary/en.json";

type Props = {
  contractData: any;
};

function Modal({ contractData }: Props) {
  const contracts = useContext(ContractContext);

  const [potentialRate, setPotentialRate] = useState<string | undefined>(
    undefined
  );
  const [poolSupply, setPoolSupply] = useState<string | undefined>(undefined);
  const [poolLend, setPoolLend] = useState<string | undefined>(undefined);

  const [auditorData, setAuditorData] = useState<Market | undefined | any>(
    contractData
  );

  const [hasRate, setHasRate] = useState<boolean>(false);

  const { contractWithSigner } = useContractWithSigner(
    contractData?.address,
    contracts?.auditor?.abi
  );

  function handleResult(data: SupplyRate) {
    setHasRate(true);
    setPotentialRate(data.potentialRate);
  }

  return (
    <div className={style.modal}>
      <p>{auditorData?.symbol}</p>
      {contractWithSigner && (
        <SupplyForm
          contractWithSigner={contractWithSigner!}
          handleResult={handleResult}
          hasRate={hasRate}
          address={contractData.address}
        />
      )}
      {hasRate && (
        <section className={style.right}>
          <p>
            {dictionary.annualRate}: <strong>{potentialRate}</strong>
          </p>
        </section>
      )}
    </div>
  );
}

export default Modal;
