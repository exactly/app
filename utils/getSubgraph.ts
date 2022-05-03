import { Dictionary } from 'types/Dictionary';

function getSubgraph() {
  const network = process.env.NEXT_PUBLIC_NETWORK ?? 'kovan';

  const dictionary: Dictionary<string> = {
    kovan: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly-kovan',
    mainnet: 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly'
  };

  return dictionary[network];
}

export default getSubgraph;
