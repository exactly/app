import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Dialog, Grid, IconButton, Slide, Typography, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';
import { track } from 'utils/mixpanel';
import { useWeb3 } from 'hooks/useWeb3';
import { mainnet } from 'wagmi';

const NEWS_READ_KEY = 'news_read';

const getReadNews = () => {
  const storedNews = localStorage.getItem(NEWS_READ_KEY);
  return storedNews ? JSON.parse(storedNews) : [];
};

const isNewsRead = (id: string) => {
  const readNews = getReadNews();
  return readNews.includes(id);
};

const NewsModal = () => {
  const { chain } = useWeb3();
  const isEthereum = chain.id === mainnet.id;
  const { t } = useTranslation();
  const news = useMemo(
    () => [
      {
        id: 'Staking',
        title: t('Staking EXA program'),
        description: [
          t('Step 1: Stake your EXA'),
          t('Step 2: Start receiving rewards from the protocol’s treasury fees.'),
        ],
        image: 'img/news/stakingProgram.svg',
        buttonTitle: t('Start staking now'),
        pathname: `${isEthereum ? 'https://app.exact.ly/staking' : '/staking'}`,
        isExternal: isEthereum,
        until: '2024-11-30T23:59:59.000Z',
      },
      {
        id: 'esEXA Vesting',
        title: t('esEXA Vesting'),
        description: [
          t('Step 1: Claim your esEXA'),
          t('Step 2: Initiate the vesting of your esEXA by depositing 15% as an EXA reserve'),
        ],
        image: 'img/news/4.png',
        buttonTitle: t('Start vesting now'),
        pathname: '/vesting',
        isExternal: false,
        until: '2023-11-30T23:59:59.000Z',
      },
      {
        id: 'Security Hub',
        title: t('Security Hub'),
        description: [
          t('Stay up to date with all the security measures we put in place to keep the Protocol safe.'),
          t("From smart contract audits to revoking token allowances, you'll find all the details right here."),
        ],
        image: 'img/news/1.png',
        buttonTitle: t('Check it now'),
        pathname: '/security',
        isExternal: false,
        until: '2023-10-31T23:59:59.000Z',
      },
      {
        id: 'Protocol Activity Monitor',
        title: t('Protocol Activity Monitor'),
        description: [
          t('This new tool offers real-time insights into the transactions and activities that shape the Protocol.'),
          t("It's a vital resource to keep you informed about the direction the Protocol is taking."),
        ],
        image: 'img/news/2.png',
        buttonTitle: t('Check transactions'),
        pathname: '/activity',
        isExternal: false,
        until: '2023-10-31T23:59:59.000Z',
      },
      {
        id: 'Revoke Allowances',
        title: t('Revoke Allowances'),
        description: [
          t('Minimize risk exposure by revoking allowances made to smart contracts to spend tokens on your behalf.'),
          t('This new tool further improves your security when interacting with the Protocol.'),
        ],
        image: 'img/news/3.png',
        buttonTitle: 'Manage allowances',
        pathname: '/revoke',
        isExternal: false,
        until: '2023-10-31T23:59:59.000Z',
      },
    ],
    [isEthereum, t],
  );

  const { pathname: currentPathname, query } = useRouter();
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(0);
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const markNewsAsRead = useCallback((titles: string[]) => {
    const readNews = getReadNews();
    const newReadNews = [...new Set([...readNews, ...titles])];
    localStorage.setItem(NEWS_READ_KEY, JSON.stringify(newReadNews));
  }, []);

  const filteredNews = news.filter(({ until, id }) => new Date(until) > new Date() && !isNewsRead(id));
  const [readIds, setReadIds] = useState<string[]>(filteredNews[0]?.id ? [filteredNews[0].id] : []);

  const closeModal = useCallback(() => {
    markNewsAsRead(readIds);
    setOpen(false);
    track('Modal Closed', {
      name: 'news',
    });
  }, [markNewsAsRead, readIds]);

  const selectedNews = useMemo(() => filteredNews[selected], [filteredNews, selected]);

  const handleSetSelected = useCallback(
    (index: number) => {
      setSelected(index);
      setReadIds((r) => [...r, filteredNews[index].id]);
    },
    [filteredNews],
  );

  const prev = useCallback(
    () => handleSetSelected((selected - 1 + filteredNews.length) % filteredNews.length),
    [filteredNews.length, handleSetSelected, selected],
  );

  const next = useCallback(
    () => handleSetSelected((selected + 1) % filteredNews.length),
    [filteredNews.length, handleSetSelected, selected],
  );

  if (currentPathname !== '/' || !selectedNews) return null;

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: { xs: '0px', md: '16px' } } }}
      TransitionComponent={Slide}
      fullScreen={isMobile}
      sx={{ top: { xs: 'auto', md: 0 } }}
    >
      <IconButton
        aria-label="close"
        onClick={closeModal}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: 'grey.500',
          zIndex: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box width={{ xs: 'auto', md: 720 }}>
        <Grid container minHeight={308} key={selected}>
          <Grid item xs={12} md={6} p={6} display="flex" flexDirection="column" justifyContent="space-between" gap={3}>
            <Box display="flex" flexDirection="column" gap={3}>
              <Typography variant="h6">{selectedNews.title}</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {selectedNews.description.map((text, index) => (
                  <Typography fontSize={14} key={`${text}-${index}`}>
                    {text}
                  </Typography>
                ))}
              </Box>
            </Box>
            {selectedNews.isExternal ? (
              <a href={selectedNews.pathname} target="_blank" rel="noopener noreferrer">
                <Button variant="contained" sx={{ width: 'fit-content' }}>
                  {selectedNews.buttonTitle}
                </Button>
              </a>
            ) : (
              <Link href={{ pathname: selectedNews.pathname, query }} legacyBehavior>
                <Button variant="contained" sx={{ width: 'fit-content' }}>
                  {selectedNews.buttonTitle}
                </Button>
              </Link>
            )}
          </Grid>
          {!isMobile && (
            <Grid item xs={12} md={6}>
              <Box position="relative" width="100%" height="100%" bgcolor="#F9FAFB">
                <Image src={selectedNews.image} alt="" layout="fill" objectFit="contain" />
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
      {filteredNews.length > 1 && (
        <Box
          width="100%"
          minHeight={48}
          bgcolor="grey.900"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
          p={1}
        >
          <Button sx={{ color: 'grey.100', fontSize: 14 }} onClick={prev}>
            Prev
          </Button>
          <Box display="flex" alignItems="center" gap={1}>
            {filteredNews.map((_, index) => (
              <Box
                key={index}
                width={selected === index ? 10 : 5}
                height={selected === index ? 10 : 5}
                borderRadius="50%"
                bgcolor="grey.100"
                sx={{ cursor: 'pointer', transition: 'all 0.1s ease-in' }}
                onClick={() => setSelected(index)}
              />
            ))}
          </Box>
          <Button sx={{ color: 'grey.100', fontSize: 14 }} onClick={next}>
            Next
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

export default NewsModal;
