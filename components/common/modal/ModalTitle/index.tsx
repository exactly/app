import React from 'react';
import styles from './style.module.scss';

type Props = {
  title: string;
  description?: string;
  link?: string;
};

function ModalTitle({ title, description, link }: Props) {
  return (
    <section className={styles.titleSection}>
      <h4 className={styles.title}>{title}</h4>
      {description && (
        <p className={styles.description}>
          {description}{' '}
          {link && (
            <a className={styles.link} href={link} target="_blank" rel="noopener noreferrer">
              Read More.
            </a>
          )}
        </p>
      )}
    </section>
  );
}

export default ModalTitle;
