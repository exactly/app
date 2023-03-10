import { Box, Typography } from '@mui/material';
import { MarketsBasicOperation, useMarketsBasic } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import React, { FC } from 'react';

type OperationTabProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

const OperationTab: FC<OperationTabProps> = ({ label, isSelected, onClick }) => {
  return (
    <Typography
      fontWeight={700}
      fontSize={15}
      color={isSelected ? 'grey.900' : 'figma.grey.600'}
      sx={{ cursor: 'pointer', '&:hover': { color: 'grey.900' } }}
      onClick={onClick}
    >
      {label}
    </Typography>
  );
};

const OperationTabs: FC = () => {
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
        label="Deposit"
        isSelected={operation === 'deposit'}
        onClick={() => handleOperationChange('deposit')}
      />
      <OperationTab
        label="Borrow"
        isSelected={operation === 'borrow'}
        onClick={() => handleOperationChange('borrow')}
      />
    </Box>
  );
};

export default OperationTabs;
