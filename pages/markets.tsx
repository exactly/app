import type { NextPage } from 'next';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import OperationsModals from 'components/OperationsModal';
import MarketsHeader from 'components/MarketsHeader';
import MarketsTable from 'components/MarketsTable';

interface Props {}

const Pools: NextPage<Props> = () => {
  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />
      <MarketsHeader />
      <MarketsTable />
      <Footer />
    </>
  );
};

export default Pools;
