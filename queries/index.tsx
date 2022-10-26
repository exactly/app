import { getAllMaturityPoolDepositsQuery } from 'queries/getAllMaturityPoolDeposits';
import { getAllMaturityPoolBorrowsQuery } from 'queries/getAllMaturityPoolBorrows';
import { getMaturityPoolDepositsQuery } from 'queries/getMaturityPoolDeposits';
import { getMaturityPoolBorrowsQuery } from 'queries/getMaturityPoolBorrows';
import { getMaturityPoolRepaysQuery } from 'queries/getMaturityPoolRepay';
import { getMaturityPoolWithdrawsQuery } from './getMaturityPoolWithdraw';
import { getLastMaturityPoolBorrowRate } from './getLastMaturityPoolBorrowRate';
import { getLastMaturityPoolDepositRate } from './getLastMaturityPoolDepositRate';
import { getSmartPoolDepositsQuery } from './getSmartPoolDeposits';
import { getSmartPoolWithdrawsQuery } from './getSmartPoolWithdraws';
import { getSmartPoolAccruedEarnings } from './getSmartPoolAccruedEarnings';
import { getSmartPoolDepositsAndWithdraws } from './getSmartPoolDepositsAndWithdraws';
import { getSmartPoolBorrowsAndRepays } from './getSmartPoolBorrowsAndRepays';

export {
  getAllMaturityPoolDepositsQuery,
  getAllMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolBorrowsQuery,
  getMaturityPoolRepaysQuery,
  getMaturityPoolWithdrawsQuery,
  getLastMaturityPoolBorrowRate,
  getLastMaturityPoolDepositRate,
  getSmartPoolDepositsQuery,
  getSmartPoolWithdrawsQuery,
  getSmartPoolAccruedEarnings,
  getSmartPoolDepositsAndWithdraws,
  getSmartPoolBorrowsAndRepays,
};
