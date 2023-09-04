import React, { FC } from 'react';
import {
  AccordionProps,
  AccordionSummaryProps,
  Accordion as MuiAccordion,
  AccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Typography,
  styled,
  Box,
  Divider,
  Link,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useTranslation } from 'react-i18next';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
  () => ({
    backgroundColor: 'transparent',
    '&:before': {
      display: 'none',
    },
  }),
);

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary expandIcon={<ExpandMoreRoundedIcon />} {...props} />
))(({ theme }) => ({
  '& .MuiSvgIcon-root': {
    fontSize: 20,
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    marginRight: theme.spacing(1.5),
  },
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(-180deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1.5),
  },
}));

type Props = {
  name: string;
  audited: boolean;
  description: string;
  reports: string[];
  information: string[];
  proxy: string;
  implementation: string;
  codeLink: string;
  explorerLink: string;
  withBorder?: boolean;
};

const ContractInfo: FC<Props> = ({
  name,
  audited,
  description,
  reports,
  information,
  proxy,
  implementation,
  codeLink,
  explorerLink,
  withBorder = true,
}) => {
  const { t } = useTranslation();

  return (
    <Accordion
      sx={{
        '&:hover .MuiAccordionSummary-root': {
          backgroundColor: 'grey.200',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon />}
        sx={{ p: 1, borderBottom: ({ palette }) => (withBorder ? `1px solid ${palette.grey[300]}` : 'none') }}
      >
        <Box display="flex" gap={1} alignItems="center" justifyContent="space-between" width="100%" pr={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              textTransform="uppercase"
              fontSize={12}
              fontWeight={700}
              color="white"
              bgcolor={audited ? 'green' : 'orange'}
              borderRadius="4px"
              px={0.5}
            >
              {audited ? t('Audited') : t('Auditing')}
            </Typography>
            <Typography fontSize={16} fontWeight={700}>
              {name}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Link target="_blank" rel="noreferrer noopener" href={codeLink}>
              <GitHubIcon sx={{ fontSize: 20, color: 'grey.500' }} />
            </Link>
            <Link target="_blank" rel="noreferrer noopener" href={explorerLink}>
              <ArticleRoundedIcon sx={{ fontSize: 20, color: 'grey.500' }} />
            </Link>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ my: 1 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" gap={2}>
            <Typography minWidth={136} fontFamily="monospace" fontSize={12} color="figma.grey.300">
              {t('Description')}
            </Typography>
            <Typography fontSize={14}>{description}</Typography>
          </Box>
          <Divider />
          <Box display="flex" gap={2}>
            <Typography minWidth={136} fontFamily="monospace" fontSize={12} color="figma.grey.300">
              {t('Auditor Report')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              {reports.map((e) => (
                <Typography key={e} fontSize={14}>
                  {e}
                </Typography>
              ))}
            </Box>
          </Box>
          <Divider />
          <Box display="flex" gap={2}>
            <Typography minWidth={136} fontFamily="monospace" fontSize={12} color="figma.grey.300">
              {t('Information')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              {information.map((e) => (
                <Typography key={e} fontSize={14}>
                  {e}
                </Typography>
              ))}
            </Box>
          </Box>
          <Divider />
          <Box display="flex" gap={2}>
            <Typography minWidth={136} fontFamily="monospace" fontSize={12} color="figma.grey.300">
              {t('Contract Address')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography fontSize={14}>{proxy}</Typography>
              <Typography fontSize={14}>{implementation}</Typography>
            </Box>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ContractInfo;
