import { Contract, ethers } from 'ethers';

import rinkebyRouter from 'protocol/deployments/rinkeby/FixedLenderETHRouter.json';
import rinkebyFixedLenderWETH from 'protocol/deployments/rinkeby/FixedLenderWETH.json';

import { getContractData } from './contracts';

import { Dictionary } from 'types/Dictionary';

function handleEth(network: string = 'rinkeby', signer: ethers.providers.JsonRpcSigner) {
  const dictionary: Dictionary<any> = {
    rinkeby: rinkebyRouter
  };

  const router = getContractData(
    network,
    dictionary[network].address,
    dictionary[network].abi,
    signer
  );

  function depositETH(qty: string) {
    if (!qty || !router) return;

    return router.depositETH({ value: ethers.utils.parseEther(qty) });
  }

  function withdrawETH(qty: string) {
    if (!qty || !router) return;

    return router.withdrawETH(ethers.utils.parseEther(qty));
  }

  function depositAtMaturityETH(maturity: string, minAssets: string, qty: string) {
    if (!qty || !router) return;

    return router.depositAtMaturityETH(maturity, ethers.utils.parseEther(minAssets), {
      value: ethers.utils.parseEther(qty)
    });
  }

  function withdrawAtMaturityETH(maturity: string, qty: string, minAssets: string) {
    if (!qty || !router) return;

    return router.withdrawAtMaturityETH(
      maturity,
      ethers.utils.parseEther(qty),
      ethers.utils.parseEther(minAssets)
    );
  }

  function borrowAtMaturityETH(maturity: string, qty: string, maxAssets: string) {
    if (!qty || !router) return;

    return router.borrowAtMaturityETH(
      maturity,
      ethers.utils.parseEther(qty),
      ethers.utils.parseEther(maxAssets)
    );
  }

  function repayAtMaturityETH(maturity: string, qty: string) {
    if (!qty || !router) return;

    return router.repayAtMaturityETH(maturity, ethers.utils.parseEther(qty), {
      value: ethers.utils.parseEther(qty)
    });
  }

  async function checkAllowance(wallet: string, FixedLenderWETH: Contract) {
    if (!wallet || !router) return;

    const allowance = await FixedLenderWETH.allowance(wallet, rinkebyRouter.address);

    return ethers.utils.formatEther(allowance);
  }

  function approve(FixedLenderWETH: Contract) {
    if (!router) return;

    const approve = FixedLenderWETH.approve(rinkebyRouter.address, ethers.constants.MaxUint256);

    return approve;
  }

  return {
    depositETH,
    withdrawETH,
    depositAtMaturityETH,
    withdrawAtMaturityETH,
    borrowAtMaturityETH,
    repayAtMaturityETH,
    checkAllowance,
    approve
  };
}

export default handleEth;
