import type { Contract } from '@ethersproject/contracts';
import type { BigNumber } from '@ethersproject/bignumber';
import type { JsonRpcSigner } from '@ethersproject/providers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';

import goerliRouter from 'protocol/deployments/goerli/MarketETHRouter.json';
import mainnetRouter from 'protocol/deployments/mainnet/MarketETHRouter.json';

import { getContractData } from './contracts';

import { Dictionary } from 'types/Dictionary';

function handleETH(network = 'goerli', signer: JsonRpcSigner) {
  const dictionary: Dictionary<any> = {
    goerli: goerliRouter,
    mainnet: mainnetRouter,
    homestead: mainnetRouter, // HACK - move to chainIds
  };

  const router = getContractData(network, dictionary[network].address, dictionary[network].abi, signer);

  function depositETH(qty: string) {
    if (!qty || !router) return;

    return router.deposit({ value: parseFixed(qty, 18) });
  }

  function withdrawETH(qty: string) {
    if (!qty || !router) return;

    return router.withdraw(parseFixed(qty, 18));
  }

  function redeemETH(shares: BigNumber) {
    if (!shares || !router) return;

    return router.redeem(shares);
  }

  function borrowETH(qty: string) {
    if (!qty || !router) return;

    return router.borrow(parseFixed(qty, 18));
  }

  function repayETH(qty: string, maxValue: string) {
    if (!qty || !router) return;

    return router.repay(parseFixed(qty, 18), { value: parseFixed(maxValue, 18) });
  }

  function refundETH(shares: BigNumber, maxValue: BigNumber) {
    if (!shares || !router) return;

    return router.refund(shares, { value: maxValue });
  }

  function depositAtMaturityETH(maturity: string, minAssets: string, qty: string) {
    if (!qty || !router) return;

    return router.depositAtMaturity(maturity, parseFixed(minAssets, 18), { value: parseFixed(qty, 18) });
  }

  function withdrawAtMaturityETH(maturity: string, qty: string, minAssets: string) {
    if (!qty || !router) return;

    return router.withdrawAtMaturity(maturity, parseFixed(qty, 18), parseFixed(minAssets, 18));
  }

  function borrowAtMaturityETH(maturity: string, qty: string, maxAssets: string) {
    if (!qty || !router) return;

    return router.borrowAtMaturity(maturity, parseFixed(qty, 18), parseFixed(maxAssets, 18));
  }

  function repayAtMaturityETH(maturity: string, qty: string, maxValue: string) {
    if (!qty || !router) return;

    return router.repayAtMaturity(maturity, parseFixed(qty, 18), { value: parseFixed(maxValue, 18) });
  }

  async function checkAllowance(wallet: string, FixedLenderWETH: Contract) {
    if (!wallet || !router) return;

    const allowance = await FixedLenderWETH.allowance(wallet, goerliRouter.address);

    return formatFixed(allowance, 18);
  }

  function approve(FixedLenderWETH: Contract) {
    if (!router) return;

    return FixedLenderWETH.approve(goerliRouter.address, MaxUint256);
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
    approve,
  };
}

export default handleETH;
