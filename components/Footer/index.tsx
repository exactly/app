import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import style from './style.module.scss';

import keys from './translations.json';

const Footer = () => {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const date = new Date();

  return (
    <footer className={style.footer}>
      <div className={style.container}>
        <div className={style.left}>
          <div className={style.images}>
            <a href="https://twitter.com/exactlyprotocol" target="_blank" rel="noreferrer noopener">
              <img alt="twitter" src="/img/social/twitter.png" />
            </a>
            <a href="https://exact.ly/discord" target="_blank" rel="noreferrer noopener">
              <img alt="discord" src="/img/social/discord.png" />
            </a>
            <a href="https://t.me/exactlyFinance" target="_blank" rel="noreferrer noopener">
              <img alt="telegram" src="/img/social/telegram.png" />
            </a>
            <a href="https://github.com/exactly-protocol" target="_blank" rel="noreferrer noopener">
              <img alt="github" src="/img/social/github.png" />
            </a>
            <a href="https://docs.exact.ly/" target="_blank" rel="noreferrer noopener">
              <img alt="gitbook" src="/img/social/gitbook.png" />
            </a>
          </div>
          <div>
            <a
              href="https://medium.com/@exactly_protocol"
              target="_blank"
              rel="noreferrer noopener"
              className={style.link}
            >
              {translations[lang].blog}
            </a>
            <a
              href="https://github.com/exactly-protocol/about/tree/main/jobs"
              target="_blank"
              rel="noreferrer noopener"
              className={style.link}
            >
              {translations[lang].careers}
            </a>
            <a
              href="https://docs.exact.ly/resources/brand-assets"
              target="_blank"
              rel="noreferrer noopener"
              className={style.link}
            >
              {translations[lang].mediaKit}
            </a>
          </div>
        </div>
        <div className={style.right}>
          <p>© {date.getFullYear()} Exactly</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
