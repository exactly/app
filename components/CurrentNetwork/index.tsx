import AlertMessage from 'components/AlertMessage';
import useNetwork from 'hooks/useNetwork';

import styles from './style.module.scss';

function CurrentNetwork() {
  const network = useNetwork();

  return (
    <AlertMessage
      label={`<span>You are connected to <strong>${network?.name}</strong> Network</span>`}
      status={network ? 'success' : 'error'}
    />
  );
}

export default CurrentNetwork;
