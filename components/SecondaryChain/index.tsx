import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from 'hooks/useWeb3';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button } from '@mui/material';
import { optimism, mainnet } from 'wagmi/chains';
import usePreviewerExactly from 'hooks/usePreviewerExactly';

const SecondaryChain = () => {
  const { t } = useTranslation();
  const {
    chain: { id: displayNetworkId },
  } = useWeb3();

  const overrideChain = displayNetworkId === optimism.id ? mainnet.id : optimism.id;
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
      href={`https://${displayNetworkId === optimism.id ? 'ethereum' : 'app'}.exact.ly`}
    >
      {t('Go to')} {displayNetworkId === optimism.id ? mainnet.name : optimism.name}
    </Button>
  ) : null;
};

export default SecondaryChain;
