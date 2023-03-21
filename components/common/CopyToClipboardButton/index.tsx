import React, { FC, useState } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  text: string;
};

const CopyToClipboardButton: FC<Props> = ({ text }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    setCopied(true);
    void navigator.clipboard.writeText(text);
  };

  return (
    <Tooltip
      title={copied ? t('Copied') : t('Copy')}
      placement="bottom"
      arrow
      enterTouchDelay={0}
      onMouseLeave={() => copied && setTimeout(() => setCopied(false), 200)}
    >
      <IconButton onClick={handleClick} size="small">
        <ContentCopyIcon sx={{ fontSize: '11px', color: 'grey.400' }} />
      </IconButton>
    </Tooltip>
  );
};

export default CopyToClipboardButton;
