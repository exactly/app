import { ActiveRoute, Status, StatusData } from 'types/Bridge';
import SuccessIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorIcon from '@mui/icons-material/ErrorRounded';
import InfoIcon from '@mui/icons-material/InfoRounded';
import i18n from 'i18n';
import chains from '../chains.json';

export function routeToTxData(route: ActiveRoute) {
  const { userTxs, bridgeTxHash, routeStatus, fromChainId } = route;
  const isBridge = userTxs.some(({ steps }) => steps?.some(({ type }) => type === 'bridge'));
  const isSwap = userTxs.some(({ steps }) => steps?.some(({ type }) => type === 'swap'));

  const status: Record<Status, StatusData> = {
    READY: {
      statusLabel: i18n.t('Ready'),
      color: '#0095FF',
      Icon: InfoIcon,
    },
    COMPLETED: {
      statusLabel: i18n.t('Success'),
      color: '#33CC59',
      Icon: SuccessIcon,
    },
    FAILED: {
      statusLabel: i18n.t('Failed'),
      color: '#D92626',
      Icon: ErrorIcon,
    },
    PENDING: {
      statusLabel: i18n.t('Pending'),
      color: '#0095FF',
      Icon: InfoIcon,
    },
  };

  const chain = chains.find(({ chainId }) => chainId === fromChainId);
  const scanner = chain ? chain.explorers[0] : undefined;

  return {
    route,
    protocol: userTxs[0]?.protocol || userTxs[0]?.steps?.[0]?.protocol,
    type: isBridge ? (isSwap ? 'Bridge + Swap' : 'Bridge') : 'Swap',
    status: status[routeStatus],
    url: `${isBridge ? 'https://socketscan.io/tx/' : `${scanner}/tx/`}${bridgeTxHash}`,
  };
}
