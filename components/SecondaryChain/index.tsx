import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { useWeb3 } from 'hooks/useWeb3';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button } from '@mui/material';
import { optimism, mainnet } from 'wagmi/chains';

const SecondaryChain = () => {
  const { t } = useTranslation();
  const { chain: displayNetwork } = useWeb3();
  const [secondaryChain, setSecondaryChain] = useState(false);

  const overrideChain = displayNetwork.id === optimism.id ? mainnet.id : optimism.id;
  const { data } = usePreviewerExactly(overrideChain);

  useEffect(() => {
    if (data?.some((item) => item?.fixedDepositPositions?.length > 0 || item?.floatingDepositAssets > 0)) {
      setSecondaryChain(true);
    }
  }, [data, setSecondaryChain]);

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
        fontWeight: 500,
        whiteSpace: 'nowrap',
        color: 'grey.900',
      }}
      target="_blank"
      href={`https://${displayNetwork.id === optimism.id ? 'ethereum' : 'app'}.exact.ly`}
    >
      {t('Go to')} {displayNetwork.id === optimism.id ? mainnet.name : optimism.name}
    </Button>
  ) : null;
};

export default SecondaryChain;
