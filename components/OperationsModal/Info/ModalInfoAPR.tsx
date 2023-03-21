import React from 'react';
import { Typography, Skeleton, Box } from '@mui/material';
import PercentIcon from '@mui/icons-material/Percent';
import ModalInfo from 'components/common/modal/ModalInfo';
import Image from 'next/image';
import formatSymbol from 'utils/formatSymbol';
import { useTranslation } from 'react-i18next';

type Props = {
  apr?: string;
  label?: string | null;
  withIcon?: boolean;
  symbol?: string;
};

function ModalInfoAPR({ apr, label, withIcon, symbol }: Props) {
  const { t } = useTranslation();
  return (
    <ModalInfo label={label || t('Your APR')} variant="column" icon={withIcon ? PercentIcon : undefined}>
      {apr ? (
        <Box display="flex" gap={1}>
          <Typography fontWeight={600} fontSize={19} color="grey.900">
            {apr}
          </Typography>
          {symbol && (
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={formatSymbol(symbol)}
              width={20}
              height={20}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
        </Box>
      ) : (
        <Skeleton width={80} />
      )}
    </ModalInfo>
  );
}

export default React.memo(ModalInfoAPR);
