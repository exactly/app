import { Box, Typography } from '@mui/material';
import { useMarketsBasic } from 'contexts/MarketsBasicContext';
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
      fontSize={16}
      color={isSelected ? 'grey.900' : 'figma.grey.600'}
      sx={{ cursor: 'pointer', '&:hover': { color: 'grey.900' } }}
      onClick={onClick}
    >
      {label}
    </Typography>
  );
};

const OperationTabs: FC = () => {
  const { operation, onChangeOperation } = useMarketsBasic();
  return (
    <Box display="flex" gap={2}>
      <OperationTab label="Borrow" isSelected={operation === 'borrow'} onClick={() => onChangeOperation('borrow')} />
      <OperationTab label="Deposit" isSelected={operation === 'deposit'} onClick={() => onChangeOperation('deposit')} />
    </Box>
  );
};

export default OperationTabs;
