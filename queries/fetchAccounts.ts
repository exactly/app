import request from 'graphql-request';

type Market = {
  id: string;
  decimals: number;
  asset: string;
  rewardAsset: string;
};

type AccountResponse = {
  depositShares: string;
  borrowShares: string;
  market: string;
  fixedPositions: FixedPositionResponse[];
};

export type Account = ReturnType<typeof mapAccountsResponse>[number];

type FixedPositionResponse = {
  principal: string;
  fee: string;
  borrow: boolean;
  maturity: number;
  rate: string;
};

const mapAccountsResponse = (response: AccountResponse[], address: string, markets: Market[]) =>
  response.map(({ borrowShares, depositShares, fixedPositions, market: marketId }) => {
    const market = markets.find(({ id }) => id === marketId);
    if (!market) throw new Error(`Market ${market} not found`);
    return {
      address,
      market,
      borrowShares: BigInt(borrowShares),
      depositShares: BigInt(depositShares),
      fixedPositions: fixedPositions.map(({ principal, fee, borrow, maturity, rate }) => ({
        borrow,
        maturity,
        principal: BigInt(principal),
        fee: BigInt(fee),
        rate: BigInt(rate),
      })),
    };
  });

export default async (subgraph: string, address: string) => {
  const { accounts: accountsResponse, markets } = await request<{ accounts: AccountResponse[]; markets: Market[] }>(
    subgraph,
    `{
    accounts (where: {address: "${address}"} ) {
      depositShares
      borrowShares
      market
      fixedPositions {
        principal
        fee
        borrow
        maturity
        rate
      }
    }
    markets {
      id
      asset
      decimals
    }
  }`,
  );
  return mapAccountsResponse(accountsResponse, address, markets);
};
