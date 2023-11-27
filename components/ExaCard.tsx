import { useEffect, useRef, useState } from "react";
import styles from "./ExaCard.module.css";
import { Box, useTheme } from "@mui/material";

const ExaCard = () => {
  const { breakpoints } = useTheme();
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window?.innerWidth;
    const h = window?.innerHeight;

    const handleMouseMove = (e: any) => {
      const b = el.current?.getBoundingClientRect();
      if (!b) return;
      const X = e.clientX / w;
      const Y = e.clientY / h;
      const rX = (X - 0.5) * 26;
      const rY = -(Y - 0.5) * 26;
      const bgX = 40 + 20 * X;
      const bgY = 40 + 20 * Y;
      document.documentElement.style.setProperty("--x", 100 * X + "%");
      document.documentElement.style.setProperty("--y", 100 * Y + "%");
      document.documentElement.style.setProperty("--bg-x", bgX + "%");
      document.documentElement.style.setProperty("--bg-y", bgY + "%");
      document.documentElement.style.setProperty("--r-x", rX + "deg");
      document.documentElement.style.setProperty("--r-y", rY + "deg");
    };

    handleMouseMove({ clientX: 10, clientY: 0.9 });
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  });

  return (
    <Box className={styles.card} ref={el}>
      <Box
        className={styles.card__wrapper}
        sx={{
          [breakpoints.down("md")]: {
            width: 200,
          },
        }}
      >
        <Box className={styles.card__3d}>
          <Box className={styles.card__image}>
            <img src="exaCard.png" alt="" />
          </Box>
          <Box className={styles.card__layer1}></Box>
          <Box className={styles.card__layer2}></Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ExaCard;
