import { Box, FormControl, FormControlLabel, Grid, Radio, RadioGroup, Skeleton, Typography } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import ModalSheetButton from 'components/common/modal/ModalSheetButton';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import MultiplierSlider from '../MultiplierSlider';
import InfoRow from '../InfoRow';
import LoopAPR from '../LoopAPR';
import HealthFactor from '../HealthFactor';
import AssetInput from '../AssetInput';

const Operation = () => {
  const { t } = useTranslation();
  const { input, setCollateral } = useLeveragerContext();

  return (
    <Box>
      <ModalBox sx={{ p: 2 }}>
        <ModalBoxRow>
          <Grid container mb={1.5}>
            <Grid item xs={7}>
              <Typography variant="caption" color="figma.grey.600">
                {t('Collateral')}
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" color="figma.grey.600">
                {t('Debt')}
              </Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={5}>
              <ModalSheetButton
                selected={Boolean(input.collateral)}
                // onClick={() => setSheetOpen([true, false])}
                sx={{ ml: -0.5 }}
              >
                {t('Collateral')}
              </ModalSheetButton>
            </Grid>
            <Grid display="flex" alignItems="center" justifyContent="center" item xs={2}>
              <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />
            </Grid>
            <Grid item xs={5}>
              <ModalSheetButton
                selected={Boolean(input.debt)}
                onClick={() => {
                  if (input.collateral) {
                    setCollateral(input.collateral);
                  }
                  // setSheetOpen([false, true]);
                }}
                disabled={!input.collateral}
                sx={{ ml: -0.5, mr: -0.5 }}
              >
                {t('Debt')}
              </ModalSheetButton>
            </Grid>
          </Grid>
        </ModalBoxRow>
        <ModalBoxRow>
          <Box display="flex" flexDirection="column" width="100%" gap={2.5} mt={1}>
            <MultiplierSlider />
            <InfoRow title={t('Net Position')} symbol={input.collateral} assets={2.8} assetsUSD={4361.79} />
          </Box>
        </ModalBoxRow>
        <ModalBoxRow>
          <ModalBoxCell display="flex" mt={1}>
            {input.collateral ? (
              <AssetInput symbol={input.collateral} operation="deposit" />
            ) : (
              <Skeleton width={96} height={36} />
            )}
          </ModalBoxCell>
          <ModalBoxCell display="flex" mt={1}>
            <FormControl>
              <RadioGroup
              // value={value}
              // onChange={handleChange}
              >
                <FormControlLabel
                  value="withdraw"
                  control={<Radio sx={{ px: 1, pt: 1, pb: 0.5 }} />}
                  label={
                    <Typography variant="caption" mt={0.5}>
                      {t('Withdraw')}
                    </Typography>
                  }
                />
                <FormControlLabel
                  value="deposit"
                  control={<Radio sx={{ px: 1, pt: 0.5, pb: 1 }} />}
                  label={
                    <Typography variant="caption" mb={0.5}>
                      {t('Deposit')}
                    </Typography>
                  }
                />
              </RadioGroup>
            </FormControl>
          </ModalBoxCell>
          <Box width="100%" mt={2.5}>
            <InfoRow title={t('Wallet Balance')} symbol={input.collateral} assets={2.1} assetsUSD={4149.82} />
          </Box>
        </ModalBoxRow>
        <ModalBoxRow>
          <ModalBoxCell mt={1}>
            <LoopAPR />
          </ModalBoxCell>
          <ModalBoxCell divisor mt={1}>
            <HealthFactor newHealthFactor="1.009x" />
          </ModalBoxCell>
        </ModalBoxRow>
      </ModalBox>
    </Box>
  );
};

export default Operation;
