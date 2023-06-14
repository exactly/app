import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Skeleton,
  Typography,
} from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import React from 'react';
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

const Operation = () => {
  const { t } = useTranslation();
  const { input, setCollateral, setBorrow } = useLeveragerContext();
  const options = useAssets();

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
                {t('Borrow')}
              </Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={5}>
              <AssetSelector
                title={t('Choose Asset')}
                value={input.collateral}
                options={options}
                onChange={setCollateral}
              />
            </Grid>
            <Grid display="flex" alignItems="center" justifyContent="center" item xs={2}>
              <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />
            </Grid>
            <Grid item xs={5}>
              <AssetSelector title={t('Choose Asset')} value={input.borrow} options={options} onChange={setBorrow} />
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
              <Skeleton width={112} height={56} />
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
      <Button fullWidth variant="contained" sx={{ mt: 4 }}>
        Leverage
      </Button>
    </Box>
  );
};

export default Operation;
