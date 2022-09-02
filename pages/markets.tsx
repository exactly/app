import type { NextPage } from 'next';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Navbar from 'components/Navbar';
import CurrentNetwork from 'components/CurrentNetwork';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import ModalsContainer from 'components/ModalsContainer';
import SmartPoolList from 'components/SmartPoolList';

import dictionary from 'dictionary/en.json';

interface Props {}

const Pools: NextPage<Props> = () => {
  return (
    <>
      <ModalsContainer />

      <MobileNavbar />
      <Navbar />
      <CurrentNetwork />

      <div style={{ marginTop: '180px' }}>
        <SmartPoolList />
      </div>

      <MaturitySelector title={dictionary.maturityPools} subtitle={dictionary.maturities} />

      <MarketsList />
      <Footer />
    </>
  );
};

export default Pools;
