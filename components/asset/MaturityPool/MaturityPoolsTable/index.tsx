import { FC } from 'react';
import { APRsPerMaturityType } from '../utils';

type MaturityPoolsTableProps = {
  APRsPerMaturity: APRsPerMaturityType;
};

const MaturityPoolsTable: FC<MaturityPoolsTableProps> = ({ APRsPerMaturity }) => {
  console.log('***********************************');
  console.log({ APRsPerMaturity });
  console.log('***********************************');

  return <></>;
};

export default MaturityPoolsTable;
