import { Box, Grid, Typography } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import ModalSheetButton from 'components/common/modal/ModalSheetButton';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import MultiplierSlider from '../MultiplierSlider';

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
          <MultiplierSlider />
        </ModalBoxRow>
        <ModalBoxRow>
          <ModalBoxCell>Wallet</ModalBoxCell>
          <ModalBoxCell />
          <ModalBoxCell>Withdraw</ModalBoxCell>
          <ModalBoxCell divisor>Deposit</ModalBoxCell>
        </ModalBoxRow>
        <ModalBoxRow>
          <ModalBoxCell>Loop APR</ModalBoxCell>
          <ModalBoxCell divisor>Health Factor</ModalBoxCell>
        </ModalBoxRow>
      </ModalBox>
    </Box>
  );
};

export default Operation;
