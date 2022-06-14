import kovanAuditor from 'protocol/deployments/kovan/Auditor.json';
import kovanFixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import kovanFixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';
import kovanPreviewer from 'protocol/deployments/kovan/Previewer.json';

import rinkebyAuditor from 'protocol/deployments/rinkeby/Auditor.json';
import rinkebyFixedLenderDAI from 'protocol/deployments/rinkeby/FixedLenderDAI.json';
import rinkebyFixedLenderWETH from 'protocol/deployments/rinkeby/FixedLenderWETH.json';
import rinkebyFixedLenderWBTC from 'protocol/deployments/rinkeby/FixedLenderWBTC.json';
import rinkebyFixedLenderUSDC from 'protocol/deployments/rinkeby/FixedLenderUSDC.json';
import rinkebyPreviewer from 'protocol/deployments/rinkeby/Previewer.json';

import { Dictionary } from 'types/Dictionary';

function getABI(network: string | undefined) {
  const dictionary: Dictionary<Dictionary<any>> = {
    kovan: {
      FixedLenders: [kovanFixedLenderDAI, kovanFixedLenderWETH],
      Auditor: kovanAuditor,
      Previewer: kovanPreviewer
    },
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

  return dictionary[network || process.env.NEXT_PUBLIC_NETWORK!];
}

export default getABI;
