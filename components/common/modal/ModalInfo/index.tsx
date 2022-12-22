import React, { type PropsWithChildren } from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { type SvgIconComponent } from '@mui/icons-material';
import Skeleton from 'react-loading-skeleton';

type ModalInfoProps = {
  label: string;
  icon?: SvgIconComponent;
};

function ModalInfo({ icon: Icon, label, children }: PropsWithChildren<ModalInfoProps>) {
  return (
    <Box>
      {Icon && <Icon sx={{ color: 'grey.900', fontSize: 14 }} />}
      <Typography fontFamily="fontFamilyMonospaced" color="grey.600" fontSize={12} mb={1} fontWeight={500}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

type FromToProps = { from?: string; to?: string };

export function FromTo({ from, to }: FromToProps) {
  to = to ? to : from;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {from ? (
        <Typography color="grey.900" fontSize={20} fontWeight={600} lineHeight={1}>
          {from}
        </Typography>
      ) : (
        <Skeleton />
      )}
      <Image src="/img/icons/arrowRight.svg" alt="to" width={14} height={14} layout="fixed" />
      {from ? (
        <Typography color="grey.900" fontSize={20} fontWeight={600} lineHeight={1}>
          {to}
        </Typography>
      ) : (
        <Skeleton />
      )}
    </Box>
  );
}

export default ModalInfo;
