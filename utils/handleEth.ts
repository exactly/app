import { BigNumber, Contract, ethers } from 'ethers';

import rinkebyRouter from 'protocol/deployments/rinkeby/MarketETHRouter.json';

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

    return router.deposit({ value: ethers.utils.parseEther(qty) });
  }

  function withdrawETH(qty: string) {
    if (!qty || !router) return;

    return router.withdraw(ethers.utils.parseEther(qty));
  }

  function redeemETH(shares: BigNumber) {
    if (!shares || !router) return;

    return router.redeem(shares);
  }

  function borrowETH(qty: string) {
    if (!qty || !router) return;

    return router.borrow(ethers.utils.parseEther(qty));
  }

  function repayETH(qty: string, maxValue: string) {
    if (!qty || !router) return;

    return router.repay(ethers.utils.parseEther(qty), {
      value: ethers.utils.parseEther(maxValue)
    });
  }

  function refundETH(shares: BigNumber, maxValue: BigNumber) {
    if (!shares || !router) return;

    return router.refund(shares, {
      value: maxValue
    });
  }

  function depositAtMaturityETH(maturity: string, minAssets: string, qty: string) {
    if (!qty || !router) return;

    return router.depositAtMaturity(maturity, ethers.utils.parseEther(minAssets), {
      value: ethers.utils.parseEther(qty)
    });
  }

  function withdrawAtMaturityETH(maturity: string, qty: string, minAssets: string) {
    if (!qty || !router) return;

    return router.withdrawAtMaturity(
      maturity,
      ethers.utils.parseEther(qty),
      ethers.utils.parseEther(minAssets)
    );
  }

  function borrowAtMaturityETH(maturity: string, qty: string, maxAssets: string) {
    if (!qty || !router) return;

    return router.borrowAtMaturity(
      maturity,
      ethers.utils.parseEther(qty),
      ethers.utils.parseEther(maxAssets)
    );
  }

  function repayAtMaturityETH(maturity: string, qty: string, maxValue: string) {
    if (!qty || !router) return;

    return router.repayAtMaturity(maturity, ethers.utils.parseEther(qty), {
      value: ethers.utils.parseEther(maxValue)
    });
  }

  async function checkAllowance(wallet: string, FixedLenderWETH: Contract) {
    if (!wallet || !router) return;

    const allowance = await FixedLenderWETH.allowance(wallet, rinkebyRouter.address);

    return ethers.utils.formatEther(allowance);
  }

  function approve(FixedLenderWETH: Contract) {
    if (!router) return;

    return FixedLenderWETH.approve(rinkebyRouter.address, ethers.constants.MaxUint256);
  }

  return {
    depositETH,
    withdrawETH,
    redeemETH,
    borrowETH,
    repayETH,
    refundETH,
    depositAtMaturityETH,
    withdrawAtMaturityETH,
    borrowAtMaturityETH,
    repayAtMaturityETH,
    checkAllowance,
    approve
  };
}

export default handleEth;
