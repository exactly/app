import React, { ChangeEventHandler, useState } from 'react';
import { Box, Button, InputBase, Typography } from '@mui/material';
import ModeEditRoundedIcon from '@mui/icons-material/ModeEditRounded';

import ModalInfo from 'components/common/modal/ModalInfo';

type Props = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

function filterPasteValue(e: any) {
  if (e.type === 'paste') {
    const data = e.clipboardData.getData('Text');
    if (/[^\d|.]+/gi.test(data)) e.preventDefault();
  }
}

function ModalInfoEditableSlippage({ value, onChange }: Props) {
  const [editable, setEditable] = useState(false);
  const blockedCharacters = ['e', 'E', '+', '-', ','];

  return (
    <ModalInfo label="Slippage Tolerance" variant="row">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {editable ? (
          <>
            <InputBase
              inputProps={{
                min: 0.0,
                type: 'number',
                value: value,
                onChange: onChange,
                name: 'Slippage Tolerance',
                onKeyDown: (e) => blockedCharacters.includes(e.key) && e.preventDefault(),
                onPaste: (e) => filterPasteValue(e),
                step: 'any',
                autoFocus: true,
                style: { textAlign: 'right', padding: 0, height: 'fit-content' },
              }}
              sx={(theme) => ({ fontSize: 14, lineHeight: 1, borderBottom: `1px solid ${theme.palette.grey[500]}` })}
            />
            <Typography variant="modalRow">%</Typography>
          </>
        ) : (
          <Typography variant="modalRow">{value} %</Typography>
        )}
        <Button
          onClick={() => setEditable((p) => !p)}
          sx={{
            '&:hover': { backgroundColor: 'transparent' },
            p: 0,
            height: 'fit-content',
            minWidth: 'fit-content',
            mb: '1px',
          }}
          disableRipple
        >
          <ModeEditRoundedIcon sx={{ fontSize: 12, color: 'grey.400' }} />
        </Button>
      </Box>
    </ModalInfo>
  );
}

export default React.memo(ModalInfoEditableSlippage);
