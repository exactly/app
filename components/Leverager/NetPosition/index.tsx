import React from 'react';
import { Box, Grid } from '@mui/material';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import { useTranslation } from 'react-i18next';
import AssetInput from '../AssetInput';
import RadioButtons from '../RadioButtons';
import InfoRow from '../InfoRow';

const NetPosition = () => {
  const { t } = useTranslation();
  const { input, netPosition, available } = useLeveragerContext();

  return (
    <Box bgcolor="grey.100" p={1} borderRadius="4px">
      <InfoRow
        title={t('Net Position')}
        symbol={input.collateralSymbol}
        assets={netPosition?.display}
        disabledMessage={t('Choose asset to see net position.')}
        expandable
      />
      <Grid container mt={1}>
        <Grid item xs={6}>
          <RadioButtons />
        </Grid>
        <Grid item xs={6}>
          <AssetInput symbol={input.collateralSymbol} />
        </Grid>
      </Grid>
      <Box mt={2.5}>
        <InfoRow
          title={`${t('Available to')} ${t(input.secondaryOperation).toLowerCase()}`}
          symbol={input.collateralSymbol}
          assets={available}
          disabledMessage={t('Choose asset to see available amount.')}
        />
        <InfoRow
          title={t('Net Position')}
          symbol={input.collateralSymbol}
          assets={netPosition?.display}
          disabledMessage={t('Choose asset to see net position.')}
        />
      </Box>
    </Box>
  );
};

export default NetPosition;
