import { Box, Button, Grid, Typography } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import MultiplierSlider from '../MultiplierSlider';
import InfoRow from '../InfoRow';
import LoopAPR from '../LoopAPR';
import HealthFactor from '../HealthFactor';
import AssetInput from '../AssetInput';
import useAssets from 'hooks/useAssets';
import AssetSelector from '../AssetSelector';
import RadioButtons from '../RadioButtons';
import ModalAlert from 'components/common/modal/ModalAlert';

const Operation = () => {
  const { t } = useTranslation();
  const { input, setCollateralSymbol, setBorrowSymbol, netPosition, available, errorData, currentLeverageRatio } =
    useLeveragerContext();
  const options = useAssets();

  const disabledSubmit = useMemo(
    () =>
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      errorData?.status ||
      (currentLeverageRatio === 1 && input.leverageRatio === 1),
    [currentLeverageRatio, errorData?.status, input.borrowSymbol, input.collateralSymbol, input.leverageRatio],
  );

  return (
    <Box>
      <ModalBox sx={{ p: 2, mb: errorData?.status ? 1 : 4 }}>
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
                title={t('Choose Asset')}
                value={input.collateralSymbol}
                options={options}
                onChange={setCollateralSymbol}
              />
            </Grid>
            <Grid display="flex" alignItems="center" justifyContent="center" item xs={2}>
              <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />
            </Grid>
            <Grid item xs={5}>
              <AssetSelector
                title={t('Choose Asset')}
                value={input.borrowSymbol}
                options={options}
                onChange={setBorrowSymbol}
                disabled={!input.collateralSymbol}
              />
            </Grid>
          </Grid>
        </ModalBoxRow>
        <ModalBoxRow>
          <Box display="flex" flexDirection="column" width="100%" gap={2.5} mt={1}>
            <MultiplierSlider />
            <InfoRow
              title={t('Net Position')}
              symbol={input.collateralSymbol}
              assets={netPosition}
              disabledMessage={t('Choose asset to see net position.')}
            />
          </Box>
        </ModalBoxRow>
        <ModalBoxRow>
          <Box display="flex" justifyContent="space-between" mt={1} gap={3} width="100%">
            <AssetInput symbol={input.collateralSymbol} />
            <RadioButtons />
          </Box>
          <Box width="100%" mt={2.5}>
            <InfoRow
              title={`${t('Available to')} ${t(input.secondaryOperation).toLowerCase()}`}
              symbol={input.collateralSymbol}
              assets={available}
              disabledMessage={t('Choose asset to see available amount.')}
            />
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

      {disabledSubmit ? (
        <Button fullWidth variant="contained" disabled>
          {t('Leverage')}
        </Button>
      ) : currentLeverageRatio !== 1 && input.leverageRatio === 1 ? (
        <Button fullWidth variant="contained">
          {t('Deleverage')}
        </Button>
      ) : (
        <Button fullWidth variant="contained">
          {`${t('Leverage')} ${netPosition} ${input.collateralSymbol} @ ${input.leverageRatio.toFixed(1)}x`}
        </Button>
      )}
    </Box>
  );
};

export default Operation;
