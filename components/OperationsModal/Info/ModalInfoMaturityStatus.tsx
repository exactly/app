import React from 'react';
import { Chip, SxProps } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import dayjs from 'dayjs';

import ModalInfo from 'components/common/modal/ModalInfo';

type Props = {
  date: number;
};

const Icon = () => <CheckCircleRoundedIcon sx={{ fontSize: 11, color: '#fff !important' }} />;

const chipSx: SxProps = {
  textTransform: 'uppercase',
  height: 20,
  width: 'fit-content',
  fontFamily: 'fontFamilyMonospaced',
  fontSize: 10,
  fontWeight: 600,
  '& .MuiChip-icon': {
    m: 0,
  },
  '& .MuiChip-label': {
    p: 0,
  },
};

function ModalInfoMaturityStatus({ date }: Props) {
  const today = dayjs().unix();
  const isCompleted = today >= date;
  const daysLeft = Math.ceil((date - today) / (3600 * 24));

  return (
    <ModalInfo label="Status" variant="column">
      {isCompleted ? (
        <Chip
          icon={<Icon />}
          sx={{
            ...chipSx,
            gap: 0.5,
            p: 0.5,
            pr: '6px',
            color: '#fff',
            backgroundColor: 'blue',
          }}
          variant="filled"
          label="Completed"
        />
      ) : (
        <Chip
          variant="filled"
          sx={{ p: 1, color: 'grey.600', backgroundColor: 'grey.200', ...chipSx }}
          label={`Ongoing - ${daysLeft} days left`}
        />
      )}
    </ModalInfo>
  );
}

export default React.memo(ModalInfoMaturityStatus);
