import React, { FC, useState } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton, Tooltip } from '@mui/material';

type Props = {
  text: string;
};

const CopyToClipboardButton: FC<Props> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    setCopied(true);
    void navigator.clipboard.writeText(text);
  };

  return (
    <Tooltip title={copied ? 'Copied' : 'Copy'} placement="bottom" arrow enterTouchDelay={0}>
      <IconButton onClick={handleClick} size="small">
        <ContentCopyIcon sx={{ fontSize: '12px', color: 'grey.400' }} />
      </IconButton>
    </Tooltip>
  );
};

export default CopyToClipboardButton;
