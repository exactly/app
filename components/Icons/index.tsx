import { createSvgIcon } from '@mui/material';
import React from 'react';

export const SimpleViewIcon = createSvgIcon(
  <svg viewBox="0 0 17 17">
    <path d="M3.597 11.861c0 .713.577 1.29 1.29 1.29h7.226a1.29 1.29 0 0 0 0-2.58H4.887a1.29 1.29 0 0 0-1.29 1.29Z" />
    <path d="M.5 3.087A2.839 2.839 0 0 1 3.339.248H13.66a2.839 2.839 0 0 1 2.839 2.84V13.41a2.839 2.839 0 0 1-2.839 2.838H3.34A2.839 2.839 0 0 1 .5 13.41V3.087Zm2.839-1.29a1.29 1.29 0 0 0-1.29 1.29V13.41c0 .712.577 1.29 1.29 1.29H13.66a1.29 1.29 0 0 0 1.29-1.29V3.087a1.29 1.29 0 0 0-1.29-1.29H3.34Z" />
  </svg>,
  'SimpleView',
);

export const AdvancedViewIcon = createSvgIcon(
  <svg viewBox="0 0 17 16">
    <path d="M.5 3.087A2.839 2.839 0 0 1 3.339.248H13.66a2.839 2.839 0 1 1 0 5.678H3.34A2.839 2.839 0 0 1 .5 3.087Zm2.839-1.29a1.29 1.29 0 1 0 0 2.58H13.66a1.29 1.29 0 0 0 0-2.58H3.34ZM.5 9.28a2.839 2.839 0 0 1 2.839-2.838H13.66a2.839 2.839 0 0 1 2.84 2.839v3.096a2.839 2.839 0 0 1-2.839 2.84H3.34A2.839 2.839 0 0 1 .5 12.376V9.281Zm2.839-1.29a1.29 1.29 0 0 0-1.29 1.29v3.097c0 .713.577 1.29 1.29 1.29H13.66a1.29 1.29 0 0 0 1.29-1.29V9.281a1.29 1.29 0 0 0-1.29-1.29H3.34Z" />
    <path d="M13.403 10.83a1.29 1.29 0 1 1-2.58 0 1.29 1.29 0 0 1 2.58 0Zm-1.29-.259a.258.258 0 1 0 0 .516.258.258 0 0 0 0-.516Z" />
  </svg>,
  'AdvancedView',
);
