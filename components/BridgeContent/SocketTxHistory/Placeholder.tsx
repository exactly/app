import { useTheme } from '@mui/material';
import React, { memo } from 'react';

const Placeholder = () => {
  const { palette } = useTheme();

  return (
    <svg width="256" height="140" viewBox="0 0 256 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="32" rx="8" fill={palette.grey[200]} />
      <rect x="24" y="12" width="40" height="8" rx="4" fill={palette.grey[300]} />
      <rect x="72" y="12" width="72" height="8" rx="4" fill={palette.grey[300]} />
      <circle cx="176" cy="16" r="6" fill="white" stroke="#7A3DDA" strokeWidth="4" />
      <path
        d="M195.333 16.6667H202.78L199.527 19.92C199.267 20.18 199.267 20.6067 199.527 20.8667C199.787 21.1267 200.207 21.1267 200.467 20.8667L204.86 16.4734C205.12 16.2134 205.12 15.7934 204.86 15.5334L200.473 11.1334C200.213 10.8734 199.793 10.8734 199.533 11.1334C199.273 11.3934 199.273 11.8134 199.533 12.0734L202.78 15.3334H195.333C194.967 15.3334 194.667 15.6334 194.667 16C194.667 16.3667 194.967 16.6667 195.333 16.6667Z"
        fill="#B4BABF"
      />
      <circle cx="224" cy="16" r="6" fill="white" stroke="#FF0024" strokeWidth="4" />
      <rect y="36" width="256" height="32" rx="8" fill={palette.grey[200]} />
      <rect x="24" y="48" width="40" height="8" rx="4" fill={palette.grey[300]} />
      <rect x="72" y="48" width="72" height="8" rx="4" fill={palette.grey[300]} />
      <circle cx="176" cy="52" r="6" fill="white" stroke="#F5B735" strokeWidth="4" />
      <path
        d="M195.333 52.6667H202.78L199.527 55.92C199.267 56.18 199.267 56.6067 199.527 56.8667C199.787 57.1267 200.207 57.1267 200.467 56.8667L204.86 52.4734C205.12 52.2134 205.12 51.7934 204.86 51.5334L200.473 47.1334C200.213 46.8734 199.793 46.8734 199.533 47.1334C199.273 47.3934 199.273 47.8134 199.533 48.0734L202.78 51.3334H195.333C194.967 51.3334 194.667 51.6334 194.667 52C194.667 52.3667 194.967 52.6667 195.333 52.6667Z"
        fill="#B4BABF"
      />
      <circle cx="224" cy="52" r="6" fill="white" stroke="#FF0024" strokeWidth="4" />
      <rect y="72" width="256" height="32" rx="8" fill={palette.grey[200]} />
      <rect x="24" y="84" width="40" height="8" rx="4" fill={palette.grey[300]} />
      <rect x="72" y="84" width="72" height="8" rx="4" fill={palette.grey[300]} />
      <circle cx="176" cy="88" r="6" fill="white" stroke="#01A1EB" strokeWidth="4" />
      <path
        d="M195.333 88.6667H202.78L199.527 91.92C199.267 92.18 199.267 92.6067 199.527 92.8667C199.787 93.1267 200.207 93.1267 200.467 92.8667L204.86 88.4734C205.12 88.2134 205.12 87.7934 204.86 87.5334L200.473 83.1334C200.213 82.8734 199.793 82.8734 199.533 83.1334C199.273 83.3934 199.273 83.8134 199.533 84.0734L202.78 87.3334H195.333C194.967 87.3334 194.667 87.6334 194.667 88C194.667 88.3667 194.967 88.6667 195.333 88.6667Z"
        fill="#B4BABF"
      />
      <circle cx="224" cy="88" r="6" fill="white" stroke="#FF0024" strokeWidth="4" />
      <rect y="108" width="256" height="32" rx="8" fill={palette.grey[200]} />
      <rect x="24" y="120" width="40" height="8" rx="4" fill={palette.grey[300]} />
      <rect x="72" y="120" width="72" height="8" rx="4" fill={palette.grey[300]} />
      <circle cx="176" cy="124" r="6" fill="white" stroke="#007B5D" strokeWidth="4" />
      <path
        d="M195.333 124.667H202.78L199.527 127.92C199.267 128.18 199.267 128.607 199.527 128.867C199.787 129.127 200.207 129.127 200.467 128.867L204.86 124.473C205.12 124.213 205.12 123.793 204.86 123.533L200.473 119.133C200.213 118.873 199.793 118.873 199.533 119.133C199.273 119.393 199.273 119.813 199.533 120.073L202.78 123.333H195.333C194.967 123.333 194.667 123.633 194.667 124C194.667 124.367 194.967 124.667 195.333 124.667Z"
        fill="#B4BABF"
      />
      <circle cx="224" cy="124" r="6" fill="white" stroke="#FF0024" strokeWidth="4" />
    </svg>
  );
};

export default memo(Placeholder);
