import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { type AllowancesState } from 'hooks/useAllowances';
import { allowanceColumns } from '.';
import { MobileSkeleton } from './Skeletons';
import RevokeButton from './RevokeButton';

const AllowancesMobile = ({ data, loading, update }: AllowancesState) => {
  const { t } = useTranslation();
  if (loading || !data) return <MobileSkeleton />;

  if (data.length === 0) {
    return (
      <Box px={2} py={4} textAlign="center" fontSize={14}>
        {t('No approvals found!')}
      </Box>
    );
  }

  return data.map((allowance) => (
    <Box
      sx={{
        '&:not(:last-child)': { borderBottom: 1, borderColor: 'grey.200' },
        px: 2,
        py: 4,
      }}
      key={`${allowance.spenderAddress}-${allowance.token}`}
    >
      <Box display="flex" flexDirection="column" gap={1} mb={3}>
        {allowanceColumns().map(({ DisplayComponent, sortKey, title }) => (
          <Box display="flex" key={sortKey}>
            <Typography color="grey.400" flex={1}>
              {title}
            </Typography>
            <Box display="flex" alignItems="flex-end" flexDirection="column" flex={1}>
              <DisplayComponent {...allowance} />
            </Box>
          </Box>
        ))}
      </Box>
      <RevokeButton {...allowance} update={update} fullWidth />
    </Box>
  ));
};

export default memo(AllowancesMobile);
