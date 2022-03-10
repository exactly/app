import { useContext } from 'react';

import Title from 'components/Title';
import Post from './Post';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import posts from './posts.json';

function FeaturedPosts() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section>
      <Title
        title={translations[lang].featuredPost}
        subtitle={translations[lang].featuredPostSubtitle}
      />
      <div className={styles.postsContainer}>
        {posts.map((post, key) => {
          return (
            <a href={post.link} target="_blank" rel="noopener noreferrer" key={key}>
              <Post title={post.title} description={post.description} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default FeaturedPosts;
