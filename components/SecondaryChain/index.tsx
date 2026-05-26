import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button } from '@mui/material';
import { optimism, mainnet } from 'viem/chains';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { defaultChain } from 'utils/client';

const SecondaryChain = () => {
  const { t } = useTranslation();
  const overrideChain = defaultChain.id === optimism.id ? mainnet.id : optimism.id;
  const { data } = usePreviewerExactly(overrideChain);

  const secondaryChain = useMemo(
    () => data?.some((item) => item?.fixedDepositPositions?.length > 0 || item?.floatingDepositAssets > 0),
    [data],
  );

  return secondaryChain ? (
    <Button
      endIcon={
        <OpenInNewIcon
          sx={{
            height: 14,
            width: 14,
            color: 'grey.900',
          }}
        />
      }
      component="a"
      variant="text"
      rel="noreferrer noopener"
      sx={{
        width: '150px',
        height: '32px',
        fontSize: 14,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: 'grey.900',
      }}
      target="_blank"
      href={`https://${defaultChain.id === optimism.id ? 'ethereum' : 'app'}.exact.ly`}
    >
      {t('Go to')} {defaultChain.id === optimism.id ? mainnet.name : optimism.name}
    </Button>
  ) : null;
};

export default SecondaryChain;
