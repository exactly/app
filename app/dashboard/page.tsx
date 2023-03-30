'use client';

import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

import DashboardHeader from 'components/dashboard/DashboardHeader';
import { usePage } from 'hooks/useAnalytics';

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  usePage();

  return (
    <>
      <DashboardHeader />
      <DashboardContent />
    </>
  );
};

export default DashBoard;
