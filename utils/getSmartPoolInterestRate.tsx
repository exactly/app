import { ethers } from 'ethers';
import request from 'graphql-request';

import { getSmartPoolAccruedEarnings } from 'queries';

import getSubgraph from './getSubgraph';

async function getSmartPoolInterestRate(network: string, fixedLenderAddress: string) {
  const oneDay = 86400;
  const days = fixedLenderAddress == '0x9f275F6D25232FFf082082a53C62C6426c1cc94C' ? 10 : 3;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const subgraphUrl = getSubgraph(network);

  const smartPoolAccruedEarnings = await request(
    subgraphUrl,
    getSmartPoolAccruedEarnings(
      currentTimestamp - oneDay * days,
      currentTimestamp,
      fixedLenderAddress
    )
  );

  if (smartPoolAccruedEarnings.smartPoolEarningsAccrueds.length == 0) return '0.00';

  let periodAccrued = 0;
  let totalAssetsByTime = 0;

  const reorder = smartPoolAccruedEarnings.smartPoolEarningsAccrueds.sort((a: any, b: any) => {
    return parseFloat(a.timestamp) - parseFloat(b.timestamp);
  });

  const allIr = []; //for the demo

  for (let i = 0; i < reorder.length - 1; i++) {
    const element = reorder[i];

    const assets = parseFloat(ethers.utils.formatEther(element.previousAssets));
    const timestamp = parseFloat(element.timestamp);
    const nextTimestamp = parseFloat(reorder[i + 1].timestamp);
    const earnings = parseFloat(ethers.utils.formatEther(element.earnings));
    const seconds = nextTimestamp - timestamp;

    totalAssetsByTime += assets * seconds;
    periodAccrued += earnings;

    const totalAssets = totalAssetsByTime / (oneDay * days); //for the demo
    const interestRate = (periodAccrued / totalAssets) * ((oneDay * 365) / (oneDay * days)) * 100; // for the demo
    allIr.push(interestRate); //for the demo
  }

  const allIrSorted = allIr.sort((a, b) => {
    return a - b;
  });

  let averageInterestrate = 0; //for the demo

  const half = Math.floor(allIrSorted.length / 2); //for the demo

  if (allIrSorted.length % 2) {
    //for the demo
    averageInterestrate = allIrSorted[half];
  } else {
    averageInterestrate = (allIrSorted[half - 1] + allIrSorted[half]) / 2.0;
  }

  if (averageInterestrate === Infinity || isNaN(averageInterestrate)) return '0.00';

  return averageInterestrate.toFixed(2); //for the demo

  // const totalAssets = totalAssetsByTime / (oneDay * days);
  // const interestRate = (periodAccrued / totalAssets) * ((oneDay * 365) / (oneDay * days)) * 100;

  // if (interestRate === Infinity || isNaN(interestRate)) return '0.00';
  // return interestRate.toFixed(2);
}

export default getSmartPoolInterestRate;
