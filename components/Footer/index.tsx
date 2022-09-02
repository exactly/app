import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

const Footer = () => {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const date = new Date();

  const [image, setImage] = useState<string>('/img/isologo.svg');

  useEffect(() => {
    if (document?.body?.dataset?.theme == 'dark') {
      setImage('/img/isologo-white.svg');
    }
  }, []);

  return (
    <footer className={styles.footer}>
      <Image src={image} alt="exactly logo" width={24} height={24} />
      <div>
        <ul className={styles.links}>
          <li>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://docs.exact.ly/resources/brand-assets"
            >
              {translations[lang].brand}
            </a>
          </li>
          <li>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://github.com/exactly-protocol/about/tree/main/jobs"
            >
              {translations[lang].jobs}
            </a>
          </li>
          <li>
            <a rel="noopener noreferrer" target="_blank" href="https://exact.ly/discord">
              {translations[lang].contact}
            </a>
          </li>
          <li>
            <a rel="noopener noreferrer" target="_blank" href="https://docs.exact.ly/">
              {translations[lang].docs}
            </a>
          </li>
          <li>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://docs.exact.ly/getting-started/white-paper"
            >
              {translations[lang].whitePaper}
            </a>
          </li>
          <li>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://medium.com/@exactly_protocol"
            >
              {translations[lang].blog}
            </a>
          </li>
          <li>
            <a rel="noopener noreferrer" target="_blank" href="https://exact.ly/tos">
              {translations[lang].tos}
            </a>
          </li>
        </ul>
      </div>
      <p className={styles.logo}>c.{date.getFullYear()}</p>
    </footer>
  );
};

export default Footer;
