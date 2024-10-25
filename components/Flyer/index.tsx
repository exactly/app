import { Box, Button, Grid, Typography, useTheme } from "@mui/material";
import { ParallaxLayer } from "@react-spring/parallax";
import Image from "next/image";

const Flyer = () => {
  const { palette } = useTheme();
  return (
    <ParallaxLayer offset={0}>
      <Box
        padding={"0 20px"}
        position="relative"
        sx={{
          backgroundImage: 'url("/Posnet-Paying.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(79deg, rgba(0, 0, 0, 0.50) -9.9%, rgba(0, 0, 0, 0.00) 49.77%)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "1152px",
          }}
        >
          <Grid container alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  mb: 9,
                }}
              >
                <Image
                  src="/exaApp.svg"
                  alt="exa card"
                  width={200}
                  height={40}
                />
              </Box>
              <Box>
                <Typography
                  variant="h2"
                  fontSize={{ xs: 32, md: 48 }}
                  fontWeight={700}
                  sx={() => ({
                    color: palette.brand.primary,
                  })}
                >
                  Buy now, pay later
                </Typography>
                <Typography
                  variant="h2"
                  fontSize={{ xs: 32, md: 48 }}
                  fontWeight={700}
                  sx={() => ({
                    color: palette.brand.primary,
                  })}
                  mb={6}
                >
                  and hold your crypto
                </Typography>
                <Typography
                  variant="body1"
                  fontSize={{ xs: 16, md: 17 }}
                  fontWeight={400}
                  color="white"
                  mb={4}
                >
                  Use your ETH as collateral for your credit line and split your
                  payments in up to 6 fixed rate installments in USD
                </Typography>
              </Box>
              <Grid container spacing={2} my={9} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={() => ({
                      backgroundColor: palette.brand.default,
                      color: palette.brand.soft,
                      borderRadius: "12px",
                      height: "60px",
                    })}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontSize={15} fontWeight={600}>
                        Join waitlist
                      </Typography>
                      <Image
                        src="/icons/notebook-pen.svg"
                        alt="notebook pen icon"
                        width={20}
                        height={20}
                      />
                    </Box>
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={(theme) => ({
                      backgroundColor: theme.palette.brand.soft,
                      color: theme.palette.brand.default,
                      borderRadius: "12px",
                      height: "60px",
                    })}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontSize={15} fontWeight={600}>
                        Follow us
                      </Typography>
                      <Image
                        src="/icons/x.svg"
                        alt="x icon"
                        width={20}
                        height={20}
                      />
                    </Box>
                  </Button>
                </Grid>
              </Grid>
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                }}
              >
                <Image src="/visa.svg" alt="exa card" width={60} height={20} />
                <Image src="/aPay.svg" alt="exa card" width={60} height={20} />
                <Image src="/gPay.svg" alt="exa card" width={60} height={20} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ParallaxLayer>
  );
};

export default Flyer;
