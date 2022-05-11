import { Deposit } from 'types/Deposit';
import { Dictionary } from 'types/Dictionary';
import { Withdraw } from 'types/Withdraw';
import { getSymbol } from './utils';

function formatSmartPoolDeposits(rawDeposits: Deposit[], rawWithdraws: Withdraw[]) {
  const depositsDict: Dictionary<any> = {};

  rawDeposits.forEach((deposit) => {
    const symbol = getSymbol(deposit.market);

    const oldAmount = depositsDict[symbol]?.assets ?? 0;
    const newAmount = oldAmount + parseInt(deposit.assets);
    depositsDict[symbol] = { ...deposit, assets: newAmount };
  });

  rawWithdraws.forEach((withdraw) => {
    const symbol = getSymbol(withdraw.market);

    const oldAmount = depositsDict[symbol]?.assets;
    const newAmount = oldAmount - parseInt(withdraw.assets);
    depositsDict[symbol] = { ...withdraw, assets: newAmount };
  });

  return depositsDict;
}

export default formatSmartPoolDeposits;
