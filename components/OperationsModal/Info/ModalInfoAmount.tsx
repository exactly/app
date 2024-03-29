import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import ModalInfo from 'components/common/modal/ModalInfo';
import formatSymbol from 'utils/formatSymbol';

type Props = {
  label: string;
  value: string;
  symbol: string;
};

function ModalInfoAmount({ label, value, symbol }: Props) {
  return (
    <ModalInfo variant="column" label={label}>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={formatSymbol(symbol)}
          width={16}
          height={16}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography variant="modalCol">{value}</Typography>
      </Box>
    </ModalInfo>
  );
}

export default React.memo(ModalInfoAmount);
