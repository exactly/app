import React, { useState } from 'react';
import { Box, Collapse, Fade, Grid, IconButton } from '@mui/material';
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

  return (
    <Box position="relative">
      {input.collateralSymbol && (
        <Box position="absolute" top={8} right={8} zIndex={99999999}>
          <IconButton sx={{ width: 20, height: 20 }} onClick={() => setExpanded((_expanded) => !_expanded)}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      )}

      <Box bgcolor="grey.100" p={0.75} borderRadius="4px" pl={2} pr={4} py={expanded ? 2 : 1}>
        <Collapse
          in={expanded}
          timeout={600}
          collapsedSize={0}
          sx={{ borderRadius: '4px' }}
          easing="cubic-bezier(0.4, 0, 0.6, 1)"
        >
          <Fade in={expanded} timeout={{ enter: 2500, exit: 1000 }} unmountOnExit mountOnEnter>
            <Box mb={1}>
              <Grid container mb={2}>
                <Grid item xs={6}>
                  <RadioButtons />
                </Grid>
                <Grid item xs={6}>
                  <AssetInput symbol={input.collateralSymbol} />
                </Grid>
              </Grid>
              <InfoRow
                title={`${t('Available to')} ${t(input.secondaryOperation).toLowerCase()}`}
                symbol={input.collateralSymbol}
                assets={available}
                disabledMessage={t('Choose asset to see available amount.')}
              />
            </Box>
          </Fade>
        </Collapse>
        <InfoRow
          title={t('Net Position')}
          symbol={input.collateralSymbol}
          assets={netPosition?.display}
          disabledMessage={t('Choose asset to see net position.')}
          onClick={input.collateralSymbol && !expanded ? () => setExpanded((_expanded) => !_expanded) : undefined}
        />
      </Box>
    </Box>
  );
};

export default NetPosition;
