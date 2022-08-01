import rinkebyAuditor from 'protocol/deployments/rinkeby/Auditor.json';
import rinkebyFixedLenderDAI from 'protocol/deployments/rinkeby/MarketDAI.json';
import rinkebyFixedLenderWETH from 'protocol/deployments/rinkeby/MarketWETH.json';
import rinkebyFixedLenderWBTC from 'protocol/deployments/rinkeby/MarketWBTC.json';
import rinkebyFixedLenderUSDC from 'protocol/deployments/rinkeby/MarketUSDC.json';
import rinkebyPreviewer from 'protocol/deployments/rinkeby/Previewer.json';

import { Dictionary } from 'types/Dictionary';

function getABI(network: string | undefined) {
  const dictionary: Dictionary<Dictionary<any>> = {
    rinkeby: {
      FixedLenders: [
        rinkebyFixedLenderDAI,
        rinkebyFixedLenderUSDC,
        rinkebyFixedLenderWETH,
        rinkebyFixedLenderWBTC
      ],
      Auditor: rinkebyAuditor,
      Previewer: rinkebyPreviewer
    },
    mainnet: {}
  };

  return dictionary[network || process.env.NEXT_PUBLIC_NETWORK!] ?? dictionary.rinkeby;
}

export default getABI;
