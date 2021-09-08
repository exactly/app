import { Network } from "@ethersproject/networks";
import { useEffect, useState } from "react";
import useProvider from "./useProvider";

export default function useNetwork() {
  const promiseProvider = useProvider();
  const [network, setNetwork] = useState<Network | undefined>(undefined);

  useEffect(() => {
    getNetwork();
  }, [promiseProvider]);

  async function getNetwork() {
    const provider = await promiseProvider;
    const network = await provider?.getNetwork();

    setNetwork(network);
  }

  return network;
}
