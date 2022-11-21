function getSubgraph(network: string | undefined) {
  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const dictionary: Record<string, string> = {
    goerli: 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-goerli',
    mainnet: 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly',
    homestead: 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly', // HACK
  };

  return dictionary[currentNetwork!.toLowerCase()];
}

export default getSubgraph;
