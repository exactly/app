import React, { ChangeEventHandler, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, ClickAwayListener, InputBase, Typography } from '@mui/material';
import ModeEditRoundedIcon from '@mui/icons-material/ModeEditRounded';

import ModalInfo from 'components/common/modal/ModalInfo';
import { track } from '../../../utils/segment';

type Props = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

function filterPasteValue(e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (e.type === 'paste') {
    const data = e.clipboardData.getData('Text');
    if (/[^\d|.]+/gi.test(data)) e.preventDefault();
  }
}

function ModalInfoEditableSlippage({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [editable, setEditable] = useState(false);
  const blockedCharacters = ['e', 'E', '+', '-', ','];
  const handleClick = useCallback(() => {
    track('Icon Clicked', {
      location: 'Operations Modal',
      icon: 'Edit',
      name: 'edit slippage',
    });
    setEditable(true);
  }, []);

  return (
    <ModalInfo label={t('Slippage Tolerance')} variant="row">
      <ClickAwayListener onClickAway={() => setEditable(false)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={handleClick}>
          {editable ? (
            <>
              <InputBase
                inputProps={{
                  min: 0.0,
                  type: 'number',
                  value: value,
                  onChange: onChange,
                  name: t('Slippage Tolerance'),
                  onKeyDown: (e) => blockedCharacters.includes(e.key) && e.preventDefault(),
                  onPaste: filterPasteValue,
                  step: 'any',
                  autoFocus: true,
                  style: { textAlign: 'right', padding: 0, height: 'fit-content', maxWidth: 50 },
                }}
                sx={(theme) => ({ fontSize: 13, lineHeight: 1, borderBottom: `1px solid ${theme.palette.grey[500]}` })}
              />
              <Typography variant="modalRow">%</Typography>
            </>
          ) : (
            <Typography variant="modalRow">{value} %</Typography>
          )}
          <Button
            sx={{
              '&:hover': { backgroundColor: 'transparent' },
              p: 0,
              height: 'fit-content',
              minWidth: 'fit-content',
              mb: '1px',
            }}
            disableRipple
          >
            <ModeEditRoundedIcon sx={{ fontSize: 11, color: 'grey.400' }} />
          </Button>
        </Box>
      </ClickAwayListener>
    </ModalInfo>
  );
}

export default React.memo(ModalInfoEditableSlippage);
