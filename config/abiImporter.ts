import goerliAuditor from 'protocol/deployments/goerli/Auditor.json';
import goerliFixedLenderDAI from 'protocol/deployments/goerli/MarketDAI.json';
import goerliFixedLenderWETH from 'protocol/deployments/goerli/MarketWETH.json';
import goerliFixedLenderWBTC from 'protocol/deployments/goerli/MarketWBTC.json';
import goerliFixedLenderUSDC from 'protocol/deployments/goerli/MarketUSDC.json';
import goerliPreviewer from 'protocol/deployments/goerli/Previewer.json';
// FIXME: need new files

import { Dictionary } from 'types/Dictionary';

function getABI(network: string | undefined) {
  const dictionary: Dictionary<Dictionary<any>> = {
    goerli: {
      FixedLenders: [
        goerliFixedLenderDAI,
        goerliFixedLenderUSDC,
        goerliFixedLenderWETH,
        goerliFixedLenderWBTC
      ],
      Auditor: goerliAuditor,
      Previewer: goerliPreviewer
    },
    mainnet: {}
  };

  return dictionary[network || process.env.NEXT_PUBLIC_NETWORK!] ?? dictionary.goerli;
}

export default getABI;
