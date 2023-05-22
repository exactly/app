import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';

import { ModalBox, ModalBoxRow } from 'components/common/modal/ModalBox';
import ModalInfo from 'components/common/modal/ModalInfo';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSheet from 'components/common/modal/ModalSheet';
import CustomSlider from 'components/common/CustomSlider';

export default function Operation() {
  const { t } = useTranslation();
  const [[fromSheetOpen, toSheetOpen], setSheetOpen] = useState([false, false]);
  const container = useRef<HTMLDivElement>(null);
  const fromSheetRef = useRef<HTMLDivElement>(null);
  const toSheetRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState<number>(100);
  const onClose = useCallback(() => setSheetOpen([false, false]), []);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
  };

  return (
    <>
      <ModalSheet
        ref={fromSheetRef}
        container={container.current}
        open={fromSheetOpen}
        onClose={onClose}
        title={t('Select Current Position')}
      >
        Something
      </ModalSheet>
      <ModalSheet
        ref={toSheetRef}
        container={container.current}
        open={toSheetOpen}
        onClose={onClose}
        title={t('Select New Position')}
      >
        <CustomSlider value={value} onChange={handleChange} />
      </ModalSheet>
      <Box
        ref={container}
        sx={{
          height: fromSheetOpen
            ? fromSheetRef.current?.clientHeight
            : toSheetOpen
            ? toSheetRef.current?.clientHeight
            : 'auto',
        }}
      >
        <ModalBox sx={{ p: 2, mb: 4 }}>
          <ModalBoxRow display="flex" flexDirection="column" alignItems="stretch">
            <Typography variant="caption" color="figma.grey.600" mb={2}>
              {t('Select Debt To Rollover')}
            </Typography>
            <Box display="flex" justifyContent="space-between">
              <Button onClick={() => setSheetOpen([true, false])}>From</Button>
              <Button onClick={() => setSheetOpen([false, true])}>To</Button>
            </Box>
          </ModalBoxRow>
        </ModalBox>
        <ModalInfo variant="row" label={t('TX Cost')}>
          xd
        </ModalInfo>
        <ModalAdvancedSettings mt={-1} mb={4}>
          HEHE
        </ModalAdvancedSettings>
        <LoadingButton disabled={true} fullWidth variant="contained">
          {t('Refinance your loan')}
        </LoadingButton>
      </Box>
    </>
  );
}
