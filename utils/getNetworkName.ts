export default (chainId: number) => ({ 1: 'mainnet' }[chainId] ?? 'goerli');
