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
            <a
              href="https://twitter.com/exactly_finance"
              target="_blank"
              rel="noreferrer"
            >
              <img alt="twitter" src="./img/social/twitter.png" />
            </a>
            <a
              href="https://discord.gg/6HppqAxQut"
              target="_blank"
              rel="noreferrer"
            >
              <img alt="discord" src="./img/social/discord.png" />
            </a>
            <a
              href="https://t.me/exactlyFinance"
              target="_blank"
              rel="noreferrer"
            >
              <img alt="telegram" src="./img/social/telegram.png" />
            </a>
            <a
              href="https://github.com/exactly-finance"
              target="_blank"
              rel="noreferrer"
            >
              <img alt="github" src="./img/social/github.png" />
            </a>
            <a
              href="https://docs.exactly.finance/"
              target="_blank"
              rel="noreferrer"
            >
              <img alt="gitbook" src="./img/social/gitbook.png" />
            </a>
            {/* <a href="" target="_blank" rel="noreferrer">
              <img alt="letter" src="./img/social/letter.png" />
            </a> */}
          </div>
          <div>
            <a
              href="https://medium.com/@exactly_finance"
              target="_blank"
              rel="noreferrer"
              className={style.link}
            >
              {translations[lang].blog}
            </a>
            <a
              href="mailto: info@exactly.finance"
              target="_blank"
              rel="noreferrer"
              className={style.link}
            >
              {translations[lang].blog}
            </a>
            <a
              href="https://github.com/exactly-finance/about/tree/main/jobs"
              target="_blank"
              rel="noreferrer"
              className={style.link}
            >
              {translations[lang].careers}
            </a>
          </div>
        </div>
        <div className={style.right}>
          <p>This software is v1.0.01</p>
          <p>© {date.getFullYear()} Exactly</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
