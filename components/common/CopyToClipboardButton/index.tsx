import React, { FC, useCallback, useState } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { track } from 'utils/segment';

type Props = {
  text: string;
  sx?: SxProps<Theme>;
};

const CopyToClipboardButton: FC<Props> = ({ text, sx }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    setCopied(true);
    void navigator.clipboard.writeText(text);
    track('Button Clicked', {
      icon: 'Copy',
      location: 'Navbar',
      name: 'copy address',
    });
  }, [text]);

  return (
    <Tooltip
      title={copied ? t('Copied') : t('Copy')}
      placement="bottom"
      arrow
      enterTouchDelay={0}
      onMouseLeave={() => copied && setTimeout(() => setCopied(false), 200)}
    >
      <IconButton onClick={handleClick} size="small">
        <ContentCopyIcon sx={{ fontSize: '11px', color: 'grey.400', ...sx }} />
      </IconButton>
    </Tooltip>
  );
};

export default CopyToClipboardButton;
