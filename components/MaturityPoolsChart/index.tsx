import { useContext, useState, useEffect } from 'react';
import { Option } from 'react-dropdown';
import { ethers } from 'ethers';
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';

import AuditorContext from 'contexts/AuditorContext';

import useContract from 'hooks/useContract';

import Loading from 'components/common/Loading';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { Address } from 'types/Address';
import { AddressContext } from 'contexts/AddressContext';
import InterestRateModelContext from 'contexts/InterestRateModelContext';

type Props = {
  dates: any;
  address: any;
};

function MaturityPoolsChart({ dates, address }: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);
  const interestRateModel = useContext(InterestRateModelContext);

  const { contract } = useContract(address?.value!, fixedLender?.abi!);

  const [borrowData, setBorrowData] = useState<any>([]);
  const [depositData, setDepositData] = useState<any>([]);

  const [poolInformation, setPoolInformation] = useState<any>([]);

  const interestRateModelContract = useContract(
    interestRateModel.address!,
    interestRateModel.abi!
  );

  useEffect(() => {
    if (dates.length > 0 && contract) {
      getMaturityPoolsState();
    }
  }, [contract, address, dates]);

  useEffect(() => {
    if (poolInformation.length > 0) {
      getBorrowAndDeposit();
    }
  }, [poolInformation]);

  async function getMaturityPoolsState() {
    const poolsData: Array<any> = [];

    dates.map((date: any) => {
      if (date.value) {
        return poolsData.push(getMarketData(date));
      }
    });

    Promise.all(poolsData).then((pools) => {
      setPoolInformation(pools);
    });
  }

  async function getBorrowAndDeposit() {
    const borrow: Array<any> = [];
    const deposit: Array<any> = [];

    const promises = poolInformation.map(async (pool: any) => {
      const supplyRate = await getSupplyRate(pool);
      const borrowRate = await getBorrowRate(pool);
      borrow.push({ ...pool, amount: pool.borrowed, apr: borrowRate * 100 });
      deposit.push({ ...pool, amount: pool.supplied, apr: supplyRate * 100 });
    });

    Promise.all(promises).then(() => {
      setBorrowData(borrow);
      setDepositData(deposit);
    });
  }

  async function getSupplyRate(pool: any) {
    if (!date) return;

    const rate = await interestRateModelContract?.contract?.getRateToSupply(
      parseInt(date.value),
      pool.raw
    );
    return rate && (await ethers.utils.formatEther(rate));
  }

  async function getBorrowRate(pool: any) {
    if (!date) return;
    const smartPool = await contract?.smartPool();

    const rate = await interestRateModelContract?.contract?.getRateToBorrow(
      parseInt(date.value),
      pool,
      smartPool,
      false
    );

    return rate && (await ethers.utils.formatEther(rate));
  }

  async function getMarketData(date: any) {
    const poolData = await contract?.maturityPools(date.value);

    const pool = {
      available: Math.round(
        parseInt(await ethers.utils.formatEther(poolData.available))
      ),
      borrowed: Math.round(
        parseInt(await ethers.utils.formatEther(poolData.borrowed))
      ),
      debt: Math.round(parseInt(await ethers.utils.formatEther(poolData.debt))),
      supplied: Math.round(
        parseInt(await ethers.utils.formatEther(poolData.supplied))
      ),
      date: date.label,
      timestamp: date.value,
      raw: poolData
    };

    return pool;
  }

  console.log(depositData);
  return (
    <div style={{ width: '100%', height: 300 }}>
      {depositData && borrowData && (
        <ResponsiveContainer>
          <ScatterChart width={730} height={250}>
            <XAxis dataKey="date" name="Date" />
            <YAxis dataKey="apr" name="APR%" unit="%" />
            <ZAxis dataKey="amount" name="Amount" range={[1, 1000]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="deposit" data={depositData} fill="#8884d8" line />
            <Scatter name="borrow" data={borrowData} fill="red" line />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default MaturityPoolsChart;
