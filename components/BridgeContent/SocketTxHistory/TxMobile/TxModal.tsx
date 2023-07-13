import React, { ReactElement, Ref, forwardRef, memo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, DialogTitle, IconButton, Slide, Typography } from '@mui/material';

import { Chain, TxData } from 'types/Bridge';
import AssetAmount from '../AssetAmount';
import { TransitionProps } from '@mui/material/transitions';
import i18n from 'i18n';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  closeModal: () => void;
  txData: TxData;
  chains?: Chain[];
};

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TxModal = ({
  open,
  closeModal,
  txData: {
    status: { Icon, color, statusLabel },
    type,
    route,
    protocol,
    url,
  },
  chains,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={closeModal} fullScreen TransitionComponent={Transition} sx={{ top: 'auto' }}>
      <IconButton
        aria-label="close"
        onClick={closeModal}
        sx={{
          position: 'absolute',
          right: 4,
          top: 8,
          color: 'grey.500',
        }}
        data-testid="modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        display={'flex'}
        alignItems={'center'}
        flexDirection={'column'}
        borderTop={'black solid 4px'}
        gap={3}
        padding={3}
      >
        <Box
          display={'flex'}
          width={'42px'}
          height={'42px'}
          bgcolor={'grey.200'}
          borderRadius={'100%'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Icon sx={{ color, fontSize: '24px' }} />
        </Box>
        <DialogTitle
          sx={{
            p: 0,
            display: 'flex',
            justifyContent: 'space-between',
          }}
          id="draggable-dialog-title"
        >
          {type} {statusLabel}
        </DialogTitle>
        <Box display={'flex'} flexDirection={'column'} width={'100%'}>
          <Box display={'flex'} gap={2} margin={2} justifyContent={'space-between'}>
            <Box display={'flex'} flex={1} flexDirection={'column'}>
              <Box mb={2} fontSize={14}>
                {t('From')}
              </Box>
              <AssetAmount mobile amount={route.fromAmount} asset={route.fromAsset} chains={chains} />
            </Box>
            <Box display={'flex'} flex={1} flexDirection={'column'} fontSize={14}>
              <Box mb={2}>{t('To')}</Box>
              <AssetAmount mobile amount={route.toAmount} asset={route.toAsset} chains={chains} />
            </Box>
          </Box>
          {protocol && (
            <Box
              display={'flex'}
              gap={1}
              padding={2}
              borderRadius={0.5}
              alignItems={'center'}
              border={1}
              borderColor={'grey.200'}
            >
              {t('Via')}{' '}
              <Image
                src={protocol.icon}
                alt={protocol.displayName}
                width={32}
                height={32}
                style={{
                  maxWidth: '100%',
                  borderRadius: '100%',
                }}
              />
              <Typography fontSize={'14px'} fontWeight={600}>
                {protocol.displayName}
              </Typography>
              <Typography fontSize={'12px'} fontWeight={500} color="grey.500">
                {dayjs(route.createdAt).locale(i18n.language).format('DD MMM YY, hh:mm ')}
              </Typography>
              <Box marginLeft={'auto'}>
                <Link href={url} target="_blank">
                  <Button variant="contained" sx={{ borderRadius: 0.5, padding: 0.5, height: '20px' }}>
                    {t('View TX')}
                  </Button>
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default memo(TxModal);
