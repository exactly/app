import { Interface, ErrorFragment, ParamType } from '@ethersproject/abi';
import AuditorABI from '../abi/Auditor.json';
import MarketABI from '../abi/Market.json';

const { format } = ErrorFragment.prototype;

export default new Interface([
  ...AuditorABI.filter(({ type }) => type === 'error'),
  ...MarketABI.filter(({ type }) => type === 'error'),
  { type: 'error', name: 'Panic', inputs: [ParamType.from('uint256')], _isFragment: true, format },
  { type: 'error', name: 'Error', inputs: [ParamType.from('string')], _isFragment: true, format },
]);
