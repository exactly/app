import { Dictionary } from 'types/Dictionary';

function getSubgraph(network: string | undefined) {
  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const dictionary: Dictionary<string> = {
    rinkeby: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly-rinkeby',
    mainnet: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly'
  };

  return dictionary[currentNetwork!.toLowerCase()];
}

export default getSubgraph;
