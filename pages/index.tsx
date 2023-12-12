import {
  Box,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import styles from "./styles.module.css";

export default function Home() {
  const { breakpoints } = useTheme();
  const mobile = useMediaQuery(breakpoints.down("sm"));

  return (
    <Box
      display="flex"
      alignItems="center"
      minHeight="90vh"
      sx={mobile ? {} : { justifyContent: "center" }}
    >
      <Box display="flex" flexWrap="wrap" gap={2}>
        <Box
          sx={
            mobile
              ? { marginTop: 8, marginX: 2 }
              : {
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: 632,
                  marginLeft: 8,
                  marginY: 14,
                }
          }
        >
          <Box
            component="main"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-evenly"}
            justifyItems={"center"}
          >
            <Box mb={mobile ? 7 : 10}>
              <img src="exaApp.svg" width={168} style={{ marginBottom: 64 }} />
              <Typography fontSize={16} fontWeight={700} mb={4}>
                DECENTRALIZE YOUR FINANCIAL LIFE, TODAY
              </Typography>
              <Box display="flex" flexDirection="column" gap={mobile ? 6 : 7}>
                <Typography
                  fontWeight={700}
                  lineHeight={"50px"}
                  sx={mobile ? { fontSize: 32 } : { fontSize: 44 }}
                >
                  Introducing the first digital self-custodial credit card
                </Typography>
                <Typography fontSize={16}>
                  Pay and earn safely with on-chain secured transactions using
                  our unique digital self-custodial credit card.{" "}
                </Typography>

                <Box
                  display="flex"
                  gap={1}
                  flexDirection={mobile ? "column" : "row"}
                >
                  <Button
                    href="https://docs.google.com/forms/d/e/1FAIpQLSer9ldKEw9mFmImaBxkJzSBwIVY63-dJAObRlfF7zVnZk1KFQ/viewform?usp=sf_link"
                    variant="contained"
                    fullWidth={!!mobile}
                  >
                    Join the waitlist
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth={!!mobile}
                    href="https://twitter.com/Exa_App"
                    sx={{
                      display: "flex",
                      gap: 0.75,
                    }}
                  >
                    Follow us on <img src="x.svg" width={12} />
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box>
            <Box
              className={styles.marquee}
              sx={{
                backgroundColor: "#303336",
              }}
            >
              <Typography
                sx={{
                  fontSize: mobile ? 24 : 44,
                  fontWeight: 400,
                  fontFamily: "Bebas Neue",
                }}
              >
                {`• SELF-CUSTODIAL • ON-CHAIN SECURED • earn yearly interest on your deposits • CASHBACK • BORROW at low interest rates • 12 installment payments • CASHBACK • DEPOSIT & Borrow on-chain • SELF-CUSTODIAL • ON-CHAIN SECURED • earn yearly interest on your deposits • CASHBACK • BORROW at low interest rates • 12 installment payments • CASHBACK • DEPOSIT & Borrow on-chain`}
                {`• SELF-CUSTODIAL • ON-CHAIN SECURED • earn yearly interest on your deposits • CASHBACK • BORROW at low interest rates • 12 installment payments • CASHBACK • DEPOSIT & Borrow on-chain • SELF-CUSTODIAL • ON-CHAIN SECURED • earn yearly interest on your deposits • CASHBACK • BORROW at low interest rates • 12 installment payments • CASHBACK • DEPOSIT & Borrow on-chain`}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          display="flex"
          justifyContent="center"
          zIndex={2}
          sx={mobile ? {} : { mr: 17, mt: "89px" }}
        >
          <img src="card-black-and-white.svg" width={mobile ? 364 : 500} />
        </Box>
      </Box>
    </Box>
  );
}
