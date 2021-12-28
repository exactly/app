import { useContext, useState } from 'react';
import { ethers } from 'ethers';

import styles from './style.module.scss';

import AssetSelector from 'components/AssetSelector';
import Input from 'components/common/Input';
import Button from 'components/common/Button';

import useContractWithSigner from 'hooks/useContractWithSigner';

import FixedLenderContext from 'contexts/FixedLenderContext';

import { Market } from 'types/Market';
import { Error } from 'types/Error';

import dictionary from 'dictionary/en.json';
import { UnderlyingData } from 'types/Underlying';
import { getUnderlyingData } from 'utils/utils';

type Props = {
  contractData: any;
  closeModal: any;
};

function SmartPoolModal({ contractData, closeModal }: Props) {
  const fixedLender = useContext(FixedLenderContext);
  const [assetData, setAssetData] = useState<Market>(contractData);

  const [qty, setQty] = useState<number>(0);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  let underlyingData: UnderlyingData | undefined = undefined;

  if (assetData?.symbol) {
    underlyingData = getUnderlyingData(
      process.env.NEXT_PUBLIC_NETWORK!,
      assetData.symbol
    );
  }

  const underlyingContract = useContractWithSigner(
    underlyingData!.address,
    underlyingData!.abi
  );

  const fixedLenderWithSigner = useContractWithSigner(
    contractData.address,
    fixedLender?.abi!
  );

  function handleClose() {
    closeModal({});
  }

  async function deposit() {
    if (!qty) {
      return setError({ status: true, msg: dictionary.defaultError });
    }

    try {
      const approval = await underlyingContract?.contractWithSigner?.approve(
        assetData.address,
        ethers.utils.parseUnits(qty!.toString())
      );

      await approval.wait();

      await fixedLenderWithSigner?.contractWithSigner?.depositToSmartPool(
        ethers.utils.parseUnits(qty!.toString())
      );
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.modal}>
      <div className={styles.closeContainer}>
        <span className={styles.closeButton} onClick={handleClose}>
          X
        </span>
      </div>
      <div className={styles.assets}>
        <p>{contractData.type == 'borrow' ? 'Borrow' : 'Deposit'}</p>
        <AssetSelector
          defaultAddress={contractData.address}
          onChange={(marketData) => setAssetData(marketData)}
        />
      </div>
      <div className={styles.fieldContainer}>
        <span>{dictionary.depositTitle}</span>
        <div className={styles.inputContainer}>
          <Input
            type="number"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQty(e.target.valueAsNumber);
              setError({ status: false, msg: '' });
            }}
            value={qty}
            placeholder="0"
          />
        </div>
        {error?.status && <p className={styles.error}>{error?.msg}</p>}
        <div className={styles.fieldContainer}>
          <div className={styles.buttonContainer}>
            <Button
              text={dictionary.deposit}
              onClick={deposit}
              className={qty && qty > 0 ? 'primary' : 'disabled'}
              disabled={!qty || qty <= 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartPoolModal;
