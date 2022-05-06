import formatNumber from './formatNumber';
import parseSymbol from './parseSymbol';

async function getExchangeRate(coin: string) {
  const parsedCoin = parseSymbol(coin);

  //in the future this request will go to our own API with cached results

  const request = await fetch(`https://api.coinbase.com/v2/prices/${parsedCoin}-USD/sell`);
  const parsedRequest = await request.json();

  if (parsedRequest.data.amount) {
    return parseFloat(parsedRequest.data.amount);
  }

  return 1;
}

export default getExchangeRate;
