import { Box, Button, Grid, Typography } from "@mui/material";
import { ParallaxLayer } from "@react-spring/parallax";
import { animated } from "@react-spring/web";
import Image from "next/image";
import { PAGES } from "../../pages";

const Introduction = ({ scrollYProgress }) => {
  return (
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
        {/* Columna Izquierda: Texto de Introducción */}
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

        {/* Columna Derecha: Imágenes con Animaciones */}
        <Grid item xs={12} md={4} sx={{ position: "relative" }}>
          {/* Imagen 1: exaCard.svg con animación de transformación */}
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
                  const s = 1 - progress * 0.34; // Escala de 1 a 0.66
                  const y = -235 * progress; // Desplazamiento vertical
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

          {/* Imagen 2: phoneCard.svg con animación de opacidad */}
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
  );
};

export default Introduction;
