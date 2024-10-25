import { IParallax, Parallax, ParallaxLayer } from "@react-spring/parallax";
import Flyer from "../components/Flyer";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  animated,
  useScroll,
  useSpring,
  useSprings,
  useTransition,
} from "@react-spring/web";
export const PAGES = 35;

const HomePage = () => {
  const parallaxRef = useRef<IParallax>(null!);
  const containerRef = useRef<HTMLDivElement>(null);
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down("sm"));

  useEffect(() => {
    if (
      parallaxRef.current &&
      parallaxRef.current.container &&
      parallaxRef.current.container.current
    ) {
      containerRef.current = parallaxRef.current.container.current;
    }
  }, []);

  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const [index, setIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    let interval;
    if (!isManual) {
      interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % 4);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isManual]);

  const transitions = useTransition(index, {
    key: index,
    from: { opacity: 1, transform: "translate3d(100%,0,0)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0)" },
    leave: { opacity: 1, transform: "translate3d(-50%,0,0)" },
    config: { duration: 500 },
  });

  const installments = useSpring({
    opacity: scrollYProgress.to({
      range: [17 / PAGES, 18 / PAGES],
      output: [0, 1],
      extrapolate: "clamp",
    }),
    transform: scrollYProgress.to({
      range: [17 / PAGES, 19 / PAGES],
      output: ["translateY(0%)", "translateY(-50%)"],
      extrapolate: "clamp",
    }),
  });

  const succesPaid = useSpring({
    opacity: scrollYProgress.to({
      range: [17 / PAGES, 18 / PAGES],
      output: [0, 1],
      extrapolate: "clamp",
    }),
    transform: scrollYProgress.to({
      range: [17 / PAGES, 19 / PAGES],
      output: ["translateY(0%)", "translateY(-70%)"],
      extrapolate: "clamp",
    }),
  });

  const addWallets = useSpring({
    opacity: scrollYProgress.to({
      range: [23 / PAGES, 25 / PAGES],
      output: [0, 1],
      extrapolate: "clamp",
    }),
    transform: scrollYProgress.to({
      range: [23 / PAGES, 25 / PAGES],
      output: ["translateY(0%)", "translateY(-70%)"],
      extrapolate: "clamp",
    }),
  });

  const images = [
    { src: "/carrousel/carrousel1.png", alt: "Imagen 1" },
    { src: "/carrousel/image2.png", alt: "Imagen 2" },
    { src: "/carrousel/image3.png", alt: "Imagen 3" },
    { src: "/carrousel/carrousel1.png", alt: "Imagen 4" },
  ];

  const steps = [
    {
      id: 1,
      image: "/exaCard.svg",
      title: "Download",
      text: "Get Exa App, available for iOS and Android.",
    },
    {
      id: 2,
      image: "/exaCard.svg",
      title: "Enable",
      text: "Verify your identity and enable the Exa Card.",
    },
    {
      id: 3,
      image: "/addTo.svg",
      title: "Add",
      text: "Add the card to your Apple or Google wallet.",
    },
    {
      id: 4,
      image: "/succesPaid.svg",
      title: "Purchase",
      text: "Pay contactless in-store or online.",
    },
  ];

  const [springs] = useSprings(steps.length, (index) => ({
    opacity: scrollYProgress.to({
      range: [(27 + index * 0.25) / PAGES, (27 + (index + 1) * 0.25) / PAGES],
      output: [0, 1],
      extrapolate: "clamp",
    }),
    transform: scrollYProgress.to({
      range: [(27 + index * 0.25) / PAGES, (27 + (index + 1) * 0.25) / PAGES],
      output: ["translateY(20px)", "translateY(0px)"],
      extrapolate: "clamp",
    }),
    from: { opacity: 0, transform: "translateY(20px)" },
  }));

  return (
    <Box
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
      ref={containerRef}
    >
      <Parallax ref={parallaxRef} pages={PAGES} style={{ overflow: "auto" }}>
        <Flyer />

        <ParallaxLayer
          offset={1}
          factor={12.5}
          style={{
            backgroundColor: palette.brand.primary,
          }}
        />

        <ParallaxLayer
          offset={16}
          factor={10}
          style={{
            backgroundColor: palette.brand.primary,
          }}
        />

        <ParallaxLayer
          sticky={{ start: 1, end: 4 }}
          style={{
            maxWidth: "1152px",
            margin: "0 auto",
            padding: "0 20px",
            position: "relative",
          }}
        >
          <Grid
            container
            sx={{ height: "100%" }}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12} md={4}>
              <Box>
                <Typography fontSize={17} fontWeight={400} color="#5F6563">
                  Introducing
                </Typography>
                <Typography fontSize={34} fontWeight={700} color="#1A211E">
                  The first onchain
                </Typography>
                <Typography fontSize={34} fontWeight={700} color="#12A594">
                  debit and credit card
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4} sx={{ position: "relative" }}>
              <animated.div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "60%",
                  opacity: scrollYProgress.to({
                    range: [2 / PAGES, 4 / PAGES],
                    output: [1, 0],
                    extrapolate: "clamp",
                  }),
                  transform: scrollYProgress
                    .to({
                      range: [1 / PAGES, 2 / PAGES],
                      output: [0, 1],
                      extrapolate: "clamp",
                    })
                    .to((progress) => {
                      const s = 1 - progress * 0.34;
                      const y = -235 * progress;
                      return `scale(${s}) translateY(${y}px)`;
                    }),
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <Image
                  src="/exaCard.svg"
                  alt="exa card"
                  layout="responsive"
                  width={500}
                  height={500}
                />
              </animated.div>

              <animated.div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "60%",
                  opacity: scrollYProgress.to({
                    range: [2 / PAGES, 4 / PAGES],
                    output: [0, 1],
                    extrapolate: "clamp",
                  }),
                  transform: scrollYProgress.to({
                    range: [2 / PAGES, 4 / PAGES],
                    output: ["translateY(0%)", "translateY(-45%)"],
                    extrapolate: "clamp",
                  }),

                  zIndex: 1,
                  pointerEvents: "none",
                }}
              >
                <Image
                  src="/phoneCard.svg"
                  alt="phoneCard"
                  layout="responsive"
                  width={500}
                  height={500}
                />
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 5, end: 7 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          <Grid
            container
            sx={{ height: "100%" }}
            alignItems="center"
            justifyContent="center"
            padding={"0 20px"}
          >
            <Grid item xs={12} md={4}>
              <animated.div
                style={{
                  opacity: scrollYProgress.to({
                    range: [4.75 / PAGES, 5.5 / PAGES, 7 / PAGES, 7.9 / PAGES],
                    output: [0, 1, 1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                <Box>
                  <Typography fontSize={17} fontWeight={400} color="#5F6563">
                    For everyone, everywhere
                  </Typography>
                  <Typography fontSize={34} fontWeight={700} color="#1A211E">
                    Available worldwide
                  </Typography>
                  <Typography fontSize={34} fontWeight={700} color="#12A594">
                    in 180+ countries
                  </Typography>
                </Box>
              </animated.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <animated.div
                style={{
                  opacity: scrollYProgress.to({
                    range: [4.75 / PAGES, 5.5 / PAGES, 7 / PAGES, 7.9 / PAGES],
                    output: [0, 1, 1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                <Box>
                  <Image
                    src="/worldWide.svg"
                    alt="exa card"
                    layout="responsive"
                    width={500}
                    height={500}
                  />
                </Box>
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 8, end: 10 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          <Grid
            container
            sx={{ height: "100%" }}
            alignItems="center"
            justifyContent="center"
            padding={"0 20px"}
          >
            <Grid item xs={12} md={4}>
              <animated.div
                style={{
                  opacity: scrollYProgress.to({
                    range: [
                      7.75 / PAGES,
                      8.5 / PAGES,
                      10 / PAGES,
                      10.9 / PAGES,
                    ],
                    output: [0, 1, 1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                <Box>
                  <Typography fontSize={17} fontWeight={400} color="#5F6563">
                    No inssurance or service fees
                  </Typography>
                  <Typography fontSize={34} fontWeight={700} color="#1A211E">
                    Activate your card
                  </Typography>
                  <Typography fontSize={34} fontWeight={700} color="#12A594">
                    free of charge
                  </Typography>
                </Box>
              </animated.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <animated.div
                style={{
                  opacity: scrollYProgress.to({
                    range: [
                      7.75 / PAGES,
                      8.5 / PAGES,
                      10 / PAGES,
                      10.9 / PAGES,
                    ],
                    output: [0, 1, 1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                <Box>
                  <animated.div style={{ width: "100%" }}>
                    <Image
                      src="/fee.svg"
                      alt="exa card"
                      layout="responsive"
                      width={500}
                      height={500}
                    />
                  </animated.div>
                </Box>
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 11, end: 12.5 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          <Grid
            container
            sx={{ height: "100%" }}
            alignItems="center"
            justifyContent="center"
            padding={"0 20px"}
          >
            <Grid item xs={12} md={4}>
              <animated.div
                style={{
                  opacity: scrollYProgress.to({
                    range: [
                      10.75 / PAGES,
                      11.5 / PAGES,
                      13 / PAGES,
                      13.9 / PAGES,
                    ],
                    output: [0, 1, 1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                <Box>
                  <Typography fontSize={17} fontWeight={400} color="#5F6563">
                    Spend with peace of mind
                  </Typography>
                  <Typography fontSize={34} fontWeight={700} color="#1A211E">
                    All transactions are
                  </Typography>
                  <Typography fontSize={34} fontWeight={700} color="#12A594">
                    private and secure
                  </Typography>
                </Box>
              </animated.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <animated.div
                style={{
                  opacity: scrollYProgress.to({
                    range: [
                      10.75 / PAGES,
                      11.5 / PAGES,
                      13 / PAGES,
                      13.9 / PAGES,
                    ],
                    output: [0, 1, 1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                <Box>
                  <animated.div style={{ width: "100%" }}>
                    <Image
                      src="/secureTransactions.svg"
                      alt="exa card"
                      layout="responsive"
                      width={500}
                      height={500}
                    />
                  </animated.div>
                </Box>
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 14, end: 15 }}
          style={{
            maxWidth: "1152px",
            margin: "0 auto",
            height: "80vh",
            top: "10vh",
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "32px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {transitions((style, i) => (
              <animated.div
                style={{
                  ...style,
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
                key={i}
              >
                <Image
                  src={images[i].src}
                  alt={images[i].alt}
                  layout="fill"
                  objectFit="cover"
                />
              </animated.div>
            ))}
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              width: "100%",
              paddingX: 2,
            }}
          >
            <Grid container justifyContent="center" spacing={2}>
              {images.map((image, idx) => (
                <Grid item xs={3} key={idx}>
                  <Button
                    variant={index === idx ? "contained" : "outlined"}
                    onClick={() => {
                      setIndex(idx);
                      setIsManual(true);
                    }}
                    fullWidth
                    sx={() => ({
                      color: index === idx ? "#1A211E" : "#5F6563",
                      backgroundColor:
                        index === idx ? "#E0F8F3D9" : "#F7F9F8D9",
                      borderRadius: "12px",
                      height: "56px",
                    })}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Image
                        src="/icons/notebook-pen.svg"
                        alt="notebook pen icon"
                        width={20}
                        height={20}
                      />
                      <Typography fontSize={15} fontWeight={600}>
                        Join waitlist
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 16, end: 19 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          {!isMobile && (
            <Box
              sx={{
                position: "absolute",
                left: "-15%",
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                textOrientation: "upright",
              }}
            >
              <Typography
                color={palette.brand.default}
                textTransform={"uppercase"}
                sx={{
                  fontWeight: 600,
                  fontSize: "15px",
                }}
              >
                <Typography component="span" mr={"16px"}>
                  03.
                </Typography>
                <Typography component="span" mr={"16px"}>
                  02.
                </Typography>
                <Typography component="span" fontWeight={600}>
                  01.installments
                </Typography>
              </Typography>
            </Box>
          )}

          <Grid
            container
            sx={{ height: "100%" }}
            padding={"0 20px"}
            alignItems="center"
          >
            <Grid item xs={12} md={4} sx={{ margin: "0 auto" }}>
              <Box
                mb={6}
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/icons/columns.svg"
                  alt="notebook pen icon"
                  width={40}
                  height={40}
                />
              </Box>
              <Box>
                <Typography
                  fontSize={34}
                  fontWeight={700}
                  color={palette.brand.default}
                  lineHeight={"34px"}
                  mb={4}
                >
                  Big purchase? Split it in up to 6 installments
                </Typography>
                <Typography fontSize={16} fontWeight={400} color="#5F6563">
                  Keep your valuable assets and watch your portfolio grow while
                  paying in up to 6 low interest installments in USD.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <animated.div
                style={{
                  paddingRight: 4,
                }}
              >
                <Image
                  src="/payment.png"
                  alt="exa card"
                  layout="responsive"
                  style={{ borderRadius: "35px" }}
                  width={500}
                  height={500}
                />
              </animated.div>
              <animated.div
                style={{
                  position: "absolute",
                  top: "25%",
                  right: "20%",
                  width: "25%",
                  aspectRatio: "1",
                  zIndex: 2,
                  ...installments,
                }}
              >
                <Image
                  src="/installments.svg"
                  alt="installments"
                  fill
                  style={{
                    objectFit: "contain",
                  }}
                />
              </animated.div>
              <animated.div
                style={{
                  position: "absolute",
                  top: "75%",
                  right: "5%",
                  width: "20%",
                  aspectRatio: "1",
                  zIndex: 2,
                  ...succesPaid,
                }}
              >
                <Image
                  src="/succesPaid.svg"
                  alt="installments"
                  fill
                  style={{
                    objectFit: "contain",
                  }}
                />
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 20, end: 22 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          {!isMobile && (
            <Box
              sx={{
                position: "absolute",
                left: "-15%",
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                textOrientation: "upright",
              }}
            >
              <Typography
                component="div"
                color={palette.brand.default}
                textTransform={"uppercase"}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 400,
                  fontSize: "15px",
                }}
              >
                <Typography component="span" sx={{ marginRight: "16px" }}>
                  03.
                </Typography>
                <Typography
                  component="span"
                  fontWeight={600}
                  sx={{ marginRight: "16px" }}
                >
                  02. Credit + debit
                </Typography>
                <Typography component="span">01.</Typography>
              </Typography>
            </Box>
          )}
          <Grid
            container
            padding={"0 20px"}
            sx={{ height: "100%" }}
            alignItems="center"
          >
            <Grid item xs={12} md={4} sx={{ margin: "0 auto" }}>
              <Box
                mb={6}
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/icons/toggle-right.svg"
                  alt="notebook pen icon"
                  width={40}
                  height={40}
                />
              </Box>
              <Box>
                <Typography
                  fontSize={34}
                  fontWeight={700}
                  color={palette.brand.default}
                  lineHeight={"34px"}
                  mb={4}
                >
                  All-in-one credit and debit virtual card
                </Typography>
                <Typography fontSize={16} fontWeight={400} color="#5F6563">
                  Just choose your preferred payment method before purchasing
                  and experience seamless, flesxible spending.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <animated.div
                style={{
                  paddingRight: 4,
                }}
              >
                <Image
                  src="/all-in-one.png"
                  alt="exa card"
                  layout="responsive"
                  style={{ borderRadius: "35px" }}
                  width={500}
                  height={500}
                />
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 23, end: 25 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          {!isMobile && (
            <Box
              sx={{
                position: "absolute",
                left: "-15%",
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                textOrientation: "upright",
              }}
            >
              <Typography
                component="div"
                color={palette.brand.default}
                textTransform={"uppercase"}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 400,
                  fontSize: "15px",
                }}
              >
                <Typography component="span" mr={"16px"} fontWeight={600}>
                  03. Earn
                </Typography>
                <Typography component="span" mr={"16px"}>
                  02.
                </Typography>
                <Typography component="span">01.</Typography>
              </Typography>
            </Box>
          )}
          <Grid
            container
            padding={"0 20px"}
            sx={{ height: "100%" }}
            alignItems="center"
          >
            <Grid item xs={12} md={4} sx={{ margin: "0 auto" }}>
              <Box
                mb={6}
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/icons/card.svg"
                  alt="notebook pen icon"
                  width={40}
                  height={40}
                />
              </Box>
              <Box>
                <Typography
                  fontSize={34}
                  fontWeight={700}
                  color={palette.brand.default}
                  lineHeight={"34px"}
                  mb={4}
                >
                  Virtual card to spend in-store or online
                </Typography>
                <Typography fontSize={16} fontWeight={400} color="#5F6563">
                  Add your Exa Card to your smartphone wallet and start spending
                  in minutes. It works with Apple Wallet and Google Pay
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <animated.div
                style={{
                  paddingRight: 4,
                }}
              >
                <Image
                  src="/all-in-one.png"
                  alt="exa card"
                  layout="responsive"
                  style={{ borderRadius: "35px" }}
                  width={500}
                  height={500}
                />
              </animated.div>

              <animated.div
                style={{
                  position: "absolute",
                  top: "80%",
                  right: "2%",
                  width: "15%",
                  aspectRatio: "1",
                  zIndex: 2,
                  ...addWallets,
                }}
              >
                <Image
                  src="/addTo.svg"
                  alt="installments"
                  fill
                  style={{
                    objectFit: "contain",
                  }}
                />
              </animated.div>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 26, end: 28 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          <Grid
            container
            padding={"0 20px"}
            spacing={4}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12} md={6}>
              <Box textAlign="center">
                <Typography
                  fontSize={34}
                  fontWeight={700}
                  lineHeight={"40px"}
                  mb={2}
                >
                  Get your Exa Card and start using it in 4 simple steps
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Grid container justifyContent="center" gap={2}>
                {springs.map((style, index) => (
                  <Grid item xs={12} md={2.5} key={steps[index].id}>
                    <animated.div
                      style={{
                        ...style,
                        border: `1px solid ${palette.neutral.soft}`,
                        borderRadius: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        src={steps[index].image}
                        alt={steps[index].title}
                        width={180}
                        height={180}
                      />

                      <Box sx={{ padding: 3 }}>
                        <Typography
                          fontSize={20}
                          fontWeight={600}
                          lineHeight={"25px"}
                          color={palette.brand.tertiary}
                        >
                          {steps[index].id}
                        </Typography>
                        <Typography
                          fontSize={22}
                          fontWeight={700}
                          lineHeight={"28px"}
                          color={palette.brand.default}
                        >
                          {steps[index].title}
                        </Typography>
                        <Typography
                          fontSize={13}
                          fontWeight={400}
                          lineHeight={"18px"}
                          color={palette.neutral.secondary}
                        >
                          {steps[index].text}
                        </Typography>
                      </Box>
                    </animated.div>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 29, end: 31 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Grid
            container
            alignItems="center"
            justifyContent="space-around"
            height={"25vh"}
          >
            <Grid item xs={12} md={4}>
              <Box>
                <Typography fontSize={28} fontWeight={700} lineHeight={"34px"}>
                  Start earning as soon as you add funds
                </Typography>
                <Typography fontSize={15}>
                  Deposit your assets in the Exa App and earn APR along with
                  additional rewards.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Image
                  src="/start-earning.svg"
                  alt="Activate your card free of charge"
                  width={300}
                  height={300}
                />
              </Box>
            </Grid>
          </Grid>

          <Grid
            container
            alignItems="center"
            justifyContent="space-around"
            height={"25vh"}
          >
            <Grid item xs={12} md={4}>
              <Box>
                <Image
                  src="/passkey.svg"
                  alt="Activate your card free of charge"
                  width={300}
                  height={300}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Typography fontSize={28} fontWeight={700} lineHeight={"34px"}>
                  Only you can access and control your assets
                </Typography>
                <Typography fontSize={16} fontWeight={400}>
                  No third party is able to freeze, access, or manipulate your
                  assets. They are always accessible to you, protected by a
                  device-stored passkey, providing you with a easy-to-use,
                  self-custodial wallet experience with no-hassle.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Grid
            container
            alignItems="center"
            justifyContent="space-around"
            height={"25vh"}
          >
            <Grid item xs={12} md={4}>
              <Box>
                <Typography fontSize={28} fontWeight={700} lineHeight={"34px"}>
                  Seamless transition between crypto and your local currency
                </Typography>
                <Typography fontSize={16} fontWeight={400}>
                  Easily deposit and withdraw to your local currency.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Image
                  src="/start-earning.svg"
                  alt="Activate your card free of charge"
                  width={300}
                  height={300}
                />
              </Box>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 32, end: 33 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          <Grid
            container
            padding={"0 20px"}
            spacing={4}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12} md={6}>
              <Box textAlign="center">
                <Typography
                  fontSize={34}
                  fontWeight={700}
                  lineHeight={"40px"}
                  mb={2}
                >
                  Get your Exa Card and start using it in 4 simple steps
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Grid container justifyContent="center" gap={2}>
                <Grid item xs={12} md={8}>
                  <Image
                    src="/tableComp.svg"
                    alt="Activate your card free of charge"
                    width={700}
                    height={700}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </ParallaxLayer>

        <ParallaxLayer
          sticky={{ start: 34, end: 35 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "1152px",
            margin: "0 auto",
          }}
        >
          <Grid
            container
            padding={"0 20px"}
            spacing={4}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12}>
              <Box textAlign="center">
                <Typography
                  fontSize={34}
                  fontWeight={700}
                  lineHeight={"40px"}
                  mb={2}
                >
                  Frequently asked questions
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Accordion
                defaultExpanded
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  borderBottom: "1px solid grey",
                }}
              >
                <AccordionSummary
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography fontSize={17} fontWeight={600}>
                    How does the Exa card work
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse malesuada lacus ex, sit amet blandit leo
                    lobortis eget.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  borderBottom: "1px solid grey",
                }}
              >
                <AccordionSummary
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography fontSize={17} fontWeight={600}>
                    How does the Exa card work
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse malesuada lacus ex, sit amet blandit leo
                    lobortis eget.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  borderBottom: "1px solid grey",
                }}
              >
                <AccordionSummary
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography fontSize={17} fontWeight={600}>
                    How does the Exa card work
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse malesuada lacus ex, sit amet blandit leo
                    lobortis eget.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </ParallaxLayer>
      </Parallax>
    </Box>
  );
};

export default HomePage;
