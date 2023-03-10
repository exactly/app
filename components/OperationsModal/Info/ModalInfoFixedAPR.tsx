import React from 'react';
import { Typography, Skeleton } from '@mui/material';

import ModalInfo from 'components/common/modal/ModalInfo';

type Props = {
  fixedAPR?: string;
};

function ModalInfoFixedAPR({ fixedAPR }: Props) {
  return (
    <ModalInfo label="Your APR" variant="column">
      {fixedAPR ? (
        <Typography fontWeight={600} fontSize={19} color="grey.900">
          {fixedAPR}
        </Typography>
      ) : (
        <Skeleton width={80} />
      )}
    </ModalInfo>
  );
}

export default React.memo(ModalInfoFixedAPR);
