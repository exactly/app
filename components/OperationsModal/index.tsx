import { useContext } from 'react';
import Image from 'next/image';

import OperationsSelector from './OperationsSelector';
import OperationContainer from './OperationContainer';

import ModalStatusContext from 'contexts/ModalStatusContext';

import styles from './styles.module.scss';
import Overlay from 'components/Overlay';

function OperationsModals() {
  const { open, setOpen } = useContext(ModalStatusContext);

  return (
    <>
      {open && (
        <>
          <section className={styles.modal}>
            <div className={styles.closeButton} onClick={() => setOpen(false)}>
              <Image src="/img/icons/close.svg" width={20} height={20} />
            </div>
            <OperationsSelector />
            <OperationContainer />
          </section>
          <Overlay
            close={() => {
              setOpen(false);
            }}
          />
        </>
      )}
    </>
  );
}

export default OperationsModals;
