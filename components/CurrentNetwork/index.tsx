import AlertMessage from 'components/AlertMessage';

import styles from './style.module.scss';

type Props = {
  network: {
    name: String;
  };
};

function CurrentNetwork({ network }: Props) {
  return (
    <AlertMessage
      label={`<span>You are connected to <strong>${network?.name}</strong> Network</span>`}
      status={network ? 'success' : 'error'}
    />
  );
}

export default CurrentNetwork;
