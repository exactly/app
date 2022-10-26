import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import DashboardHeader from 'components/DashboardHeader';
import OperationsModals from 'components/OperationsModal';

const DashboardContent = dynamic(() => import('components/DashboardContent'));

const DashBoard: NextPage = () => {
  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />
      <DashboardHeader />
      <DashboardContent />
      <Footer />
    </>
  );
};

export default DashBoard;
