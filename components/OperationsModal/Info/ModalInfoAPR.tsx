import React from 'react';
import { Typography, Skeleton } from '@mui/material';
import PercentIcon from '@mui/icons-material/Percent';
import ModalInfo from 'components/common/modal/ModalInfo';

type Props = {
  apr?: string;
  label?: string;
  withIcon?: boolean;
};

function ModalInfoAPR({ apr, label, withIcon }: Props) {
  return (
    <ModalInfo label={label || 'Your APR'} variant="column" icon={withIcon ? PercentIcon : undefined}>
      {apr ? (
        <Typography fontWeight={600} fontSize={19} color="grey.900">
          {apr}
        </Typography>
      ) : (
        <Skeleton width={80} />
      )}
    </ModalInfo>
  );
}

export default React.memo(ModalInfoAPR);
