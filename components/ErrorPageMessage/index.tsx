import React from 'react';
import Button from 'components/common/Button';
import { useRouter } from 'next/router';
import Link from 'next/link';

import styles from './style.module.scss';

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
      <Link href={{ pathname: '/', query }} className={styles.buttonContainer}>
        <Button text="Go to Markets" />
      </Link>
    </section>
  );
}

export default ErrorPageMessage;
