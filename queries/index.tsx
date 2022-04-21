import { getMaturityPoolDepositsQuery } from 'queries/getMaturityPoolDeposits';
import { getMaturityPoolBorrowsQuery } from 'queries/getMaturityPoolBorrows';
import { getMaturityPoolRepaysQuery } from 'queries/getMaturityPoolRepay';
import { getMaturityPoolWithdrawsQuery } from './getMaturityPoolWithdraw';
import { getSmartPoolDepositsQuery } from './getSmartPoolDeposits';
import { getSmartPoolWithdrawsQuery } from './getSmartPoolWithdraws';

export {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolRepaysQuery,
  getMaturityPoolWithdrawsQuery,
  getSmartPoolDepositsQuery,
  getSmartPoolWithdrawsQuery
};
