import type { NextPage } from 'next';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import SmartPoolList from 'components/SmartPoolList';
import OperationsModals from 'components/OperationsModal';

import dictionary from 'dictionary/en.json';

interface Props {}

const Pools: NextPage<Props> = () => {
  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />

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
