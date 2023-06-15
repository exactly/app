import React from 'react';
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLeveragerContext } from 'contexts/LeveragerContext';

const RadioButtons = () => {
  const { t } = useTranslation();
  const { input, setSecondaryOperation, currentLeverageRatio } = useLeveragerContext();

  return (
    <RadioGroup
      value={input.secondaryOperation}
      onChange={(e) => setSecondaryOperation(e.target.value as 'deposit' | 'withdraw')}
    >
      <FormControlLabel
        disabled={!input.collateralSymbol || !input.borrowSymbol || input.leverageRatio > currentLeverageRatio}
        value="withdraw"
        control={<Radio sx={{ px: 1, pt: 1, pb: 0.5 }} />}
        label={
          <Typography variant="caption" mt={0.5}>
            {t('Withdraw')}
          </Typography>
        }
      />
      <FormControlLabel
        disabled={!input.collateralSymbol || !input.borrowSymbol || input.leverageRatio < currentLeverageRatio}
        value="deposit"
        control={<Radio sx={{ px: 1, pt: 0.5, pb: 1 }} />}
        label={
          <Typography variant="caption" mb={0.5}>
            {t('Deposit')}
          </Typography>
        }
      />
    </RadioGroup>
  );
};

export default RadioButtons;
