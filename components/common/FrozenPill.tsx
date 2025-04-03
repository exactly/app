import React from 'react';
import { Chip, SxProps, Tooltip, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

const FrozenPill = React.forwardRef(function FrozenPill() {
  const { palette } = useTheme();
  const { t } = useTranslation();

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

  return (
    <Tooltip
      title={t('The USDC.e market is frozen (EXAIP-18), you can still withdraw or repay your positions')}
      placement="top"
      arrow
    >
      <Link
        href={'https://gov.exact.ly/#/proposal/0xe5164e083ef7889c1fd8482c04bf3c2b36aaeca712515fa8a4cd5b2e0be5b068'}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Chip
          variant="filled"
          sx={{ p: 1, color: palette.operation.fixed, backgroundColor: '#E5F6FD', ...chipSx, cursor: 'pointer' }}
          label={`Frozen`}
        />
      </Link>
    </Tooltip>
  );
});

export default FrozenPill;
