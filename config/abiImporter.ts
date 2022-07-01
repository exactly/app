import rinkebyAuditor from 'protocol/deployments/rinkeby/Auditor.json';
import rinkebyFixedLenderDAI from 'protocol/deployments/rinkeby/FixedLenderDAI.json';
import rinkebyFixedLenderWETH from 'protocol/deployments/rinkeby/FixedLenderWETH.json';
import rinkebyFixedLenderWBTC from 'protocol/deployments/rinkeby/FixedLenderWBTC.json';
import rinkebyFixedLenderUSDC from 'protocol/deployments/rinkeby/FixedLenderUSDC.json';
import rinkebyPreviewer from 'protocol/deployments/rinkeby/Previewer.json';

import { Dictionary } from 'types/Dictionary';

function getABI(network: string | undefined) {
  const dictionary: Dictionary<Dictionary<any>> = {
    rinkeby: {
      FixedLenders: [
        rinkebyFixedLenderDAI,
        rinkebyFixedLenderWETH,
        rinkebyFixedLenderWBTC,
        rinkebyFixedLenderUSDC
      ],
      Auditor: rinkebyAuditor,
      Previewer: rinkebyPreviewer
    },
    mainnet: {}
  };

  return dictionary[network || process.env.NEXT_PUBLIC_NETWORK!] ?? dictionary.rinkeby;
}

export default getABI;
