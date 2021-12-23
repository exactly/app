import { ethers } from "ethers";

export interface UnderlyingNetwork {
  [text: string]: Underlying;
}

export interface Underlying {
  [key: string]: UnderlyingData;
}

export interface UnderlyingData {
  address: string,
  abi: ethers.ContractInterface
}