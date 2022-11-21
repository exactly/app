function getSubgraph(network?: string) {
  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;
  if (!currentNetwork) return;

  const dictionary: Record<string, string> = {
    goerli: 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-goerli',
    mainnet: 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly',
    homestead: 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly', // HACK
  };

  return dictionary[currentNetwork.toLowerCase()];
}

export default getSubgraph;
