import { Address, parseEther, parseUnits, type PublicClient, type WalletClient } from 'viem';

import { erc20, erc20Market, ethRouter, auditor, type ERC20TokenSymbol, type Coin } from '../utils/contracts';

const MaxUint256 = 2n ** 256n - 1n;
const WeiPerEther = 10n ** 18n;

const options = (client: WalletClient) => {
  if (!client.account) {
    throw new Error('Account is undefined');
  }
  return { chain: client.chain, account: client.account };
};

type ActionParams = {
  publicClient: PublicClient;
  walletClient: WalletClient;
};

const actions = ({ publicClient, walletClient }: ActionParams) => {
  const enterMarket = async (symbol: ERC20TokenSymbol) => {
    const auditorContract = await auditor({ walletClient });
    const erc20MarketContract = await erc20Market(symbol);
    if (!walletClient.account) return;
    const args = [erc20MarketContract.address] as const;
    const gas = await auditorContract.estimateGas.enterMarket(args, options(walletClient));
    await auditorContract.write.enterMarket(args, { ...options(walletClient), gasLimit: gas * 2n });
  };

  const exitMarket = async (symbol: ERC20TokenSymbol) => {
    const auditorContract = await auditor({ walletClient });
    const erc20MarketContract = await erc20Market(symbol);
    const args = [erc20MarketContract.address] as const;
    const gas = await auditorContract.estimateGas.exitMarket(args, options(walletClient));
    await auditorContract.write.exitMarket(args, { ...options(walletClient), gasLimit: gas * 2n });
  };

  type FloatingOperationParams = {
    symbol: Coin;
    amount: string;
    receiver: Address;
  };

  const deposit = async ({ symbol, amount, receiver }: FloatingOperationParams) => {
    if (symbol === 'ETH') {
      const ethRouterContract = await ethRouter({ walletClient });
      const qty = parseEther(amount);
      const args = { value: qty };
      const gas = await ethRouterContract.estimateGas.deposit({ ...options(walletClient), ...args });
      await ethRouterContract.write.deposit({
        ...options(walletClient),
        ...args,
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { walletClient, publicClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const approveArgs = [erc20MarketContract.address, MaxUint256] as const;
      const approveGas = await erc20Contract.estimateGas.approve(approveArgs, options(walletClient));
      await erc20Contract.write.approve(approveArgs, {
        ...options(walletClient),
        gasLimit: approveGas * 2n,
      });
      const args = [qty, receiver] as const;
      const gas = await erc20MarketContract.estimateGas.deposit(args, options(walletClient));
      await erc20MarketContract.write.deposit(args, {
        ...options(walletClient),
        gasLimit: gas * 2n,
      });
    }
  };

  const borrow = async ({ symbol, amount, receiver }: FloatingOperationParams) => {
    if (symbol === 'ETH') {
      const wethMarketContract = await erc20Market('WETH', { walletClient });
      const ethRouterContract = await ethRouter({ walletClient });
      const qty = parseEther(amount);
      const approveArgs = [ethRouterContract.address, MaxUint256] as const;
      const approveGas = await wethMarketContract.estimateGas.approve(approveArgs, options(walletClient));
      await wethMarketContract.write.approve(approveArgs, {
        ...options(walletClient),
        gasLimit: approveGas * 2n,
      });
      const args = [qty] as const;
      const gas = await ethRouterContract.estimateGas.borrow(args, options(walletClient));
      await ethRouterContract.write.borrow(args, {
        ...options(walletClient),
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { publicClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const args = [qty, receiver, receiver] as const;
      const gas = await erc20MarketContract.estimateGas.borrow(args, options(walletClient));
      await erc20MarketContract.write.borrow(args, {
        ...options(walletClient),
        gasLimit: gas * 2n,
      });
    }
  };

  type FixedOperationParams = {
    symbol: Coin;
    amount: string;
    maturity: bigint;
    receiver: Address;
  };

  const minAssets = (quantity: bigint) => (quantity * parseEther('0.98')) / WeiPerEther;
  const maxAssets = (quantity: bigint) => (quantity * parseEther('1.02')) / WeiPerEther;

  const depositAtMaturity = async ({ symbol, amount, maturity, receiver }: FixedOperationParams) => {
    if (symbol === 'ETH') {
      const ethRouterContract = await ethRouter({ walletClient });
      const qty = parseEther(amount);
      const args = [maturity, minAssets(qty)] as const;
      const gas = await ethRouterContract.estimateGas.depositAtMaturity(args, {
        ...options(walletClient),
        value: qty,
      });
      await ethRouterContract.write.depositAtMaturity(args, {
        ...options(walletClient),
        value: qty,
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { walletClient, publicClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const approveArgs = [erc20MarketContract.address, MaxUint256] as const;
      const approveGas = await erc20Contract.estimateGas.approve(approveArgs, options(walletClient));
      await erc20Contract.write.approve(approveArgs, {
        ...options(walletClient),
        gasLimit: approveGas * 2n,
      });
      const args = [maturity, qty, minAssets(qty), receiver] as const;
      const gas = await erc20MarketContract.estimateGas.depositAtMaturity(args, options(walletClient));
      await erc20MarketContract.write.depositAtMaturity(args, {
        ...options(walletClient),
        gasLimit: gas * 2n,
      });
    }
  };

  const borrowAtMaturity = async ({ symbol, amount, maturity, receiver }: FixedOperationParams) => {
    if (symbol === 'ETH') {
      const wethMarketContract = await erc20Market('WETH', { walletClient });
      const ethRouterContract = await ethRouter({ walletClient: walletClient });
      const qty = parseEther(amount);
      const approveArgs = [ethRouterContract.address, MaxUint256] as const;
      const approveGas = await wethMarketContract.estimateGas.approve(approveArgs, options(walletClient));
      await wethMarketContract.write.approve(approveArgs, {
        ...options(walletClient),
        gasLimit: approveGas * 2n,
      });
      const args = [maturity, qty, maxAssets(qty)] as const;
      const gas = await ethRouterContract.estimateGas.borrowAtMaturity(args, options(walletClient));
      await ethRouterContract.write.borrowAtMaturity(args, {
        ...options(walletClient),
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { publicClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const args = [maturity, qty, maxAssets(qty), receiver, receiver] as const;
      const gas = await erc20MarketContract.estimateGas.borrowAtMaturity(args, options(walletClient));
      await erc20MarketContract.write.borrowAtMaturity(args, {
        ...options(walletClient),
        gasLimit: gas * 2n,
      });
    }
  };

  return { enterMarket, exitMarket, deposit, borrow, depositAtMaturity, borrowAtMaturity };
};

export type Actions = ReturnType<typeof actions>;

export default actions;
