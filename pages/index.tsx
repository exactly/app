import { Box, Button, Typography, useTheme } from "@mui/material";
import ExaCard from "../components/ExaCard";

export default function Home() {
  const { breakpoints } = useTheme();

  return (
    <Box
      sx={{
        position: "relative",

        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        component="main"
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-evenly"}
        height={"100%"}
        p={10}
        justifyItems={"center"}
        sx={{
          [breakpoints.down("md")]: {
            flexDirection: "column",
            height:'unset',
            gap: '48px'
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 500,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography fontSize={14}>Introducing</Typography>
            <img
              src="exaApp.png"
              width={250}
              style={{
                marginLeft: -8,
              }}
            />
          </Box>
          <Typography>
            Deposit and borrow on-chain.
            <br /> The first self-custodial debit and credit card.
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              href="https://docs.google.com/forms/d/e/1FAIpQLSer9ldKEw9mFmImaBxkJzSBwIVY63-dJAObRlfF7zVnZk1KFQ/viewform?usp=sf_link"
              variant="contained"
            >
              Join the Waitlist
            </Button>
          </Box>
        </Box>
        <Box display="flex" justifyContent="center">
          <ExaCard />
        </Box>
      </Box>
      <Box></Box>
    </Box>
  );
}
