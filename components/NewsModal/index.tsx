import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, Grid, IconButton, Slide, Typography, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';

const news = [
  {
    title: 'Old',
    description: ['See info'],
    image: 'img/assets/EXA.svg',
    buttonTitle: 'Get EXA',
    pathname: '/governance',
    until: '2023-08-31T23:59:59.000Z',
  },
  {
    title: 'Airdrop is now live',
    description: [
      'Check if you are eligible for the EXA token airdrop in our Governance page.',
      "Holding EXA will enable you to participate in discussions, propose enhancements, and cast votes to shape the protocol's evolution.",
    ],
    image: 'img/assets/EXA.svg',
    buttonTitle: 'Get EXA',
    pathname: '/governance',
    until: '2023-10-31T23:59:59.000Z',
  },
  {
    title: 'Protocol Activity Monitor',
    description: ['See info'],
    image: 'img/assets/EXA.svg',
    buttonTitle: 'Get EXA',
    pathname: '/governance',
    until: '2023-10-31T23:59:59.000Z',
  },
];

const NEWS_READ_KEY = 'news_read';

const NewsModal = () => {
  const { pathname: currentPathname, query } = useRouter();
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(0);
  const closeModal = useCallback(() => setOpen(false), []);
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const getReadNews = () => {
    const storedNews = localStorage.getItem(NEWS_READ_KEY);
    return storedNews ? JSON.parse(storedNews) : [];
  };

  const markNewsAsRead = useCallback((titles: string[]) => {
    const readNews = getReadNews();
    const newReadNews = [...new Set([...readNews, ...titles])];
    localStorage.setItem(NEWS_READ_KEY, JSON.stringify(newReadNews));
  }, []);

  const isNewsRead = (title: string) => {
    const readNews = getReadNews();
    return readNews.includes(title);
  };

  const filteredNews = news.filter(({ until, title }) => new Date(until) > new Date() && !isNewsRead(title));
  const [readTitles, setReadTitles] = useState<string[]>(filteredNews[0]?.title ? [filteredNews[0].title] : []);

  const selectedNews = useMemo(() => filteredNews[selected], [filteredNews, selected]);

  const handleSetSelected = useCallback(
    (index: number) => {
      setSelected(index);
      setReadTitles((r) => [...r, filteredNews[index].title]);
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

  useEffect(() => {
    return () => {
      markNewsAsRead(readTitles);
    };
  }, [filteredNews, markNewsAsRead, readTitles]);

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
        data-testid="modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box width={{ xs: 'auto', md: 720 }} minHeight={308}>
        <Grid container>
          <Grid item xs={12} md={6} p={6} display="flex" flexDirection="column" justifyContent="space-between" gap={3}>
            <Box display="flex" flexDirection="column" gap={3}>
              <Typography variant="h6">{selectedNews.title}</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {selectedNews.description.map((text, index) => (
                  <Typography key={`${text}-${index}`}>{text}</Typography>
                ))}
              </Box>
            </Box>
            <Link href={{ pathname: selectedNews.pathname, query }} legacyBehavior>
              <Button variant="contained" sx={{ width: 'fit-content' }}>
                {selectedNews.buttonTitle}
              </Button>
            </Link>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box position="relative" width="100%" height="100%">
              <Image src={selectedNews.image} alt="news image" layout="fill" objectFit="contain" />
            </Box>
          </Grid>
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
                sx={{ cursor: 'pointer' }}
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
