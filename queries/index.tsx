import { getMaturityPoolDepositsQuery } from 'queries/getMaturityPoolDeposits';
import { getMaturityPoolBorrowsQuery } from 'queries/getMaturityPoolBorrows';
import { getMaturityPoolRepaysQuery } from 'queries/getMaturityPoolRepay';
import { getMaturityPoolWithdrawsQuery } from './getMaturityPoolWithdraw';
import { getLastMaturityPoolBorrowRate } from './getLastMaturityPoolBorrowRate';
import { getLastMaturityPoolDepositRate } from './getLastMaturityPoolDepositRate';
import { getSmartPoolDepositsQuery } from './getSmartPoolDeposits';
import { getSmartPoolWithdrawsQuery } from './getSmartPoolWithdraws';

export {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolRepaysQuery,
  getMaturityPoolWithdrawsQuery,
  getLastMaturityPoolBorrowRate,
  getLastMaturityPoolDepositRate,
  getSmartPoolDepositsQuery,
  getSmartPoolWithdrawsQuery
};
