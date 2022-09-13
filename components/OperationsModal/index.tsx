import { useContext } from 'react';

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
