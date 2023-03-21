import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Typography } from '@mui/material';
import { MarketsBasicOperation, useMarketsBasic } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';

type OperationTabProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

const OperationTab: FC<OperationTabProps> = ({ label, isSelected, onClick }) => {
  return (
    <ButtonBase onClick={onClick} disableRipple>
      <Typography
        fontWeight={700}
        fontSize={15}
        color={isSelected ? 'grey.900' : 'figma.grey.600'}
        sx={{ '&:hover': { color: 'grey.900' } }}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
};

const OperationTabs: FC = () => {
  const { t } = useTranslation();
  const { operation, onChangeOperation, setSelected } = useMarketsBasic();
  const { setQty, setErrorData, setLoadingButton, setErrorButton } = useOperationContext();

  const handleOperationChange = (op: MarketsBasicOperation) => {
    setQty('');
    setSelected(0);
    onChangeOperation(op);
    setErrorData(undefined);
    setLoadingButton({});
    setErrorButton(undefined);
  };

  return (
    <Box display="flex" gap={2}>
      <OperationTab
        label={t('Deposit')}
        isSelected={operation === 'deposit'}
        onClick={() => handleOperationChange('deposit')}
      />
      <OperationTab
        label={t('Borrow')}
        isSelected={operation === 'borrow'}
        onClick={() => handleOperationChange('borrow')}
      />
    </Box>
  );
};

export default OperationTabs;
