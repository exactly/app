import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import styles from './style.module.scss';
import { Button } from '@mui/material';

type Props = {
  code: number;
  description: string;
  message: string;
};

function ErrorPageMessage({ code, description, message }: Props) {
  const { query } = useRouter();
  return (
    <section className={styles.errorContainer}>
      <h1 className={styles.code}>{code}</h1>
      <h2 className={styles.description}>{description}</h2>
      <p className={styles.message}>{message}</p>
      <Link href={{ pathname: '/', query }}>
        <Button variant="contained">Go to Markets</Button>
      </Link>
    </section>
  );
}

export default ErrorPageMessage;
