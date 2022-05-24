import { Dictionary } from 'types/Dictionary';

function getSubgraph(network: string | undefined = 'kovan') {
  const dictionary: Dictionary<string> = {
    kovan: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly-kovan',
    rinkeby: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly-rinkeby',
    mainnet: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly'
  };

  return dictionary[network.toLowerCase()];
}

export default getSubgraph;
