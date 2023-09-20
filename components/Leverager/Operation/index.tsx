import { Box, Button, Grid, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import MultiplierSlider from '../MultiplierSlider';
import LoopAPR from '../LoopAPR';
import HealthFactor from '../HealthFactor';
import AssetSelector from '../AssetSelector';
import ModalAlert from 'components/common/modal/ModalAlert';
import NetPosition from '../NetPosition';
import formatNumber from 'utils/formatNumber';

const Operation = () => {
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const {
    input,
    setCollateralSymbol,
    setBorrowSymbol,
    netPosition,
    errorData,
    collateralOptions,
    borrowOptions,
    setViewSummary,
    disabledSubmit,
    isOverLeveraged,
  } = useLeveragerContext();

  return (
    <Box>
      <ModalBox sx={{ p: 2, mb: errorData?.status || isOverLeveraged ? 1 : 4 }}>
        <ModalBoxRow>
          <Grid container mb={1.5}>
            <Grid item xs={7}>
              <Typography variant="caption" color="figma.grey.600">
                {t('Collateral')}
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" color="figma.grey.600">
                {t('Borrow')}
              </Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={5}>
              <AssetSelector
                title={isMobile ? t('Choose') : t('Choose Asset')}
                currentValue={input.collateralSymbol}
                options={collateralOptions}
                onChange={setCollateralSymbol}
              />
            </Grid>
            <Grid display="flex" alignItems="center" justifyContent="center" item xs={2}>
              <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />
            </Grid>
            <Grid item xs={5}>
              <AssetSelector
                title={isMobile ? t('Choose') : t('Choose Asset')}
                currentValue={input.borrowSymbol}
                options={borrowOptions}
                onChange={setBorrowSymbol}
                disabled={!input.collateralSymbol}
              />
            </Grid>
          </Grid>
        </ModalBoxRow>
        <ModalBoxRow>
          <Box display="flex" flexDirection="column" width="100%" gap={2.5} mt={1}>
            <MultiplierSlider />
            <NetPosition />
          </Box>
        </ModalBoxRow>
        <ModalBoxRow>
          <ModalBoxCell mt={1}>
            <LoopAPR />
          </ModalBoxCell>
          <ModalBoxCell divisor mt={1}>
            <HealthFactor />
          </ModalBoxCell>
        </ModalBoxRow>
      </ModalBox>
      {errorData?.status && <ModalAlert message={errorData.message} variant={errorData.variant} />}
      {isOverLeveraged && (
        <ModalAlert message={t('You are currently over leveraged with the selected markets.')} variant="info" />
      )}
      {disabledSubmit ? (
        <Button fullWidth variant="contained" disabled>
          {t('Leverage')}
        </Button>
      ) : (
        <Button fullWidth variant="contained" onClick={() => setViewSummary(true)}>
          {`${input.secondaryOperation === 'deposit' ? t('Leverage') : t('Deleverage')} ${formatNumber(
            netPosition ?? '0',
            input.collateralSymbol,
          )} ${input.collateralSymbol} @ ${input.leverageRatio.toFixed(2)}x`}
        </Button>
      )}
    </Box>
  );
};

export default Operation;
