import { Interface, ErrorFragment, ParamType } from '@ethersproject/abi';
import InterestRateModelABI from '../abi/InterestRateModel.json';
import AuditorABI from '../abi/Auditor.json';
import MarketABI from '../abi/Market.json';

const { format } = ErrorFragment.prototype;

export default new Interface([
  ...MarketABI.filter(({ type }) => type === 'error'),
  ...AuditorABI.filter(({ type }) => type === 'error'),
  ...InterestRateModelABI.filter(({ type }) => type === 'error'),
  { type: 'error', name: 'Panic', inputs: [ParamType.from('uint256')], _isFragment: true, format },
  { type: 'error', name: 'Error', inputs: [ParamType.from('string')], _isFragment: true, format },
]);
