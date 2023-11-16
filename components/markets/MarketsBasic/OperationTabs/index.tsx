import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Typography } from '@mui/material';
import { MarketsBasicOperation, useMarketsBasic } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import { track } from '../../../../utils/segment';

type OperationTabProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

const OperationTab: FC<OperationTabProps> = ({ label, isSelected, onClick }) => {
  const handleClick = useCallback(() => {
    onClick();
    track('Button Clicked', {
      location: 'Markets Basic',
      name: 'operation',
      operation: label,
    });
  }, [label, onClick]);
  return (
    <ButtonBase
      onClick={handleClick}
      disableRipple
      data-testid={`simple-view-${label.toLowerCase()}-tab`}
      data-active={isSelected}
    >
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
    setSelected(0n);
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
