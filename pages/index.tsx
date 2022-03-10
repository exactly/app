import Auditors from 'components/Auditors';
import Button from 'components/common/Button';
import FeaturedPosts from 'components/FeaturedPosts';
import Footer from 'components/Footer';
import Hero from 'components/Hero';
import HowItWorks from 'components/HowItWorks';
import Investors from 'components/Investors';
import NavbarHome from 'components/NavbarHome';

function Home() {
  return (
    <>
      <NavbarHome />
      <Hero />
      <HowItWorks />
      <Investors />
      <Auditors />
      <FeaturedPosts />
      <Footer />
    </>
  );
}

export default Home;
