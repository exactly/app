import React, { useMemo } from 'react';
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLeveragerContext } from 'contexts/LeveragerContext';

const RadioButtons = () => {
  const { t } = useTranslation();
  const { input, setSecondaryOperation, currentLeverageRatio } = useLeveragerContext();

  const disabledReclaim = useMemo(
    () => !input.collateralSymbol || !input.borrowSymbol || input.leverageRatio > currentLeverageRatio,
    [currentLeverageRatio, input.borrowSymbol, input.collateralSymbol, input.leverageRatio],
  );

  const disabledSupply = useMemo(
    () => !input.collateralSymbol || !input.borrowSymbol || input.leverageRatio < currentLeverageRatio,
    [currentLeverageRatio, input.borrowSymbol, input.collateralSymbol, input.leverageRatio],
  );

  return (
    <RadioGroup
      value={input.secondaryOperation}
      onChange={(e) => setSecondaryOperation(e.target.value as 'deposit' | 'withdraw')}
      sx={{ mx: 1 }}
    >
      <FormControlLabel
        disabled={disabledReclaim}
        value="withdraw"
        control={<Radio sx={{ px: 1, pt: 1, pb: 0.5 }} />}
        sx={{ opacity: disabledReclaim ? 0.3 : 1 }}
        label={
          <Typography variant="caption" mt={0.5}>
            {t('Reclaim')}
          </Typography>
        }
      />
      <FormControlLabel
        disabled={disabledSupply}
        value="deposit"
        control={<Radio sx={{ px: 1, pt: 0.5, pb: 1 }} />}
        sx={{ opacity: disabledSupply ? 0.3 : 1 }}
        label={
          <Typography variant="caption" mb={0.5}>
            {t('Supply')}
          </Typography>
        }
      />
    </RadioGroup>
  );
};

export default RadioButtons;
