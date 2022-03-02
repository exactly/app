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
    </>
  );
}

export default Home;
