import React, { useRef, useState } from 'react';
import { Box, Collapse, Fade, Grid, IconButton, Slide } from '@mui/material';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import { useTranslation } from 'react-i18next';
import AssetInput from '../AssetInput';
import RadioButtons from '../RadioButtons';
import InfoRow from '../InfoRow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const NetPosition = () => {
  const { t } = useTranslation();
  const { input, netPosition, available } = useLeveragerContext();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  return (
    <Collapse in={expanded} timeout={600} collapsedSize={44} sx={{ borderRadius: '4px' }}>
      <Box bgcolor="grey.100" p={1} borderRadius="4px" position="relative">
        <Box position="absolute" top={8} right={8} zIndex={99999999}>
          <IconButton sx={{ width: 20, height: 20 }} onClick={() => setExpanded((_expanded) => !_expanded)}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
        {!expanded && (
          <InfoRow
            title={t('Net Position')}
            symbol={input.collateralSymbol}
            assets={netPosition?.display}
            disabledMessage={t('Choose asset to see net position.')}
            expandable
            onClick={() => setExpanded((_expanded) => !_expanded)}
          />
        )}
        <Box ref={containerRef}>
          {expanded ? (
            <>
              <Fade in={expanded} timeout={2500} unmountOnExit mountOnEnter>
                <Grid container mt={1}>
                  <Grid item xs={6}>
                    <RadioButtons />
                  </Grid>
                  <Grid item xs={6}>
                    <AssetInput symbol={input.collateralSymbol} />
                  </Grid>
                </Grid>
              </Fade>
              <Box mt={2.5}>
                <Fade in={expanded} timeout={2500} unmountOnExit mountOnEnter>
                  <Box>
                    <InfoRow
                      title={`${t('Available to')} ${t(input.secondaryOperation).toLowerCase()}`}
                      symbol={input.collateralSymbol}
                      assets={available}
                      disabledMessage={t('Choose asset to see available amount.')}
                    />
                  </Box>
                </Fade>
                <Slide
                  direction="down"
                  in={expanded}
                  container={containerRef.current}
                  timeout={600}
                  easing="cubic-bezier(0.4, 0, 0.6, 1)"
                  unmountOnExit
                  mountOnEnter
                >
                  <Box>
                    <InfoRow
                      title={t('Net Position')}
                      symbol={input.collateralSymbol}
                      assets={netPosition?.display}
                      disabledMessage={t('Choose asset to see net position.')}
                    />
                  </Box>
                </Slide>
              </Box>
            </>
          ) : (
            <Box height={120} />
          )}
        </Box>
      </Box>
    </Collapse>
  );
};

export default NetPosition;
