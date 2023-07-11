import React, { ReactElement, Ref, forwardRef, memo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, DialogTitle, IconButton, Slide, Typography } from '@mui/material';

import { TxData } from 'types/Bridge';
import AssetAmount from '../AssetAmount';
import { TransitionProps } from '@mui/material/transitions';
import i18n from 'i18n';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  closeModal: () => void;
  txData: TxData;
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
        gap={'24px'}
        padding={'24px'}
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
          <Box display={'flex'} gap={'16px'} margin={'16px'} justifyContent={'space-between'}>
            <Box display={'flex'} flex={1} flexDirection={'column'}>
              <Box marginBottom={'16px'} fontSize={'14px'}>
                From
              </Box>
              <AssetAmount mobile amount={route.fromAmount} asset={route.fromAsset} />
            </Box>
            <Box display={'flex'} flex={1} flexDirection={'column'} fontSize={'14px'}>
              <Box marginBottom={'16px'}>To</Box>
              <AssetAmount mobile amount={route.toAmount} asset={route.toAsset} />
            </Box>
          </Box>
          {protocol && (
            <Box
              display={'flex'}
              gap={'8px'}
              padding={'16px'}
              borderRadius={'4px'}
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
                  <Button variant="contained" sx={{ borderRadius: '4px', padding: '4px', height: '20px' }}>
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
