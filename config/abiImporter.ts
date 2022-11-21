import goerliAuditor from '@exactly-protocol/protocol/deployments/goerli/Auditor.json';
import goerliFixedLenderDAI from '@exactly-protocol/protocol/deployments/goerli/MarketDAI.json';
import goerliFixedLenderWETH from '@exactly-protocol/protocol/deployments/goerli/MarketWETH.json';
import goerliFixedLenderWBTC from '@exactly-protocol/protocol/deployments/goerli/MarketWBTC.json';
import goerliFixedLenderUSDC from '@exactly-protocol/protocol/deployments/goerli/MarketUSDC.json';
import goerliFixedLenderWSTETH from '@exactly-protocol/protocol/deployments/goerli/MarketwstETH.json';
import goerliPreviewer from '@exactly-protocol/protocol/deployments/goerli/Previewer.json';

import mainnetAuditor from '@exactly-protocol/protocol/deployments/mainnet/Auditor.json';
import mainnetFixedLenderDAI from '@exactly-protocol/protocol/deployments/mainnet/MarketDAI.json';
import mainnetFixedLenderWETH from '@exactly-protocol/protocol/deployments/mainnet/MarketWETH.json';
import mainnetFixedLenderWBTC from '@exactly-protocol/protocol/deployments/mainnet/MarketWBTC.json';
import mainnetFixedLenderUSDC from '@exactly-protocol/protocol/deployments/mainnet/MarketUSDC.json';
import mainnetFixedLenderWSTETH from '@exactly-protocol/protocol/deployments/mainnet/MarketwstETH.json';
import mainnetPreviewer from '@exactly-protocol/protocol/deployments/mainnet/Previewer.json';

function getABI(network: string | undefined) {
  const dictionary: Record<string, Record<string, any>> = {
    goerli: {
      FixedLenders: [
        goerliFixedLenderDAI,
        goerliFixedLenderUSDC,
        goerliFixedLenderWETH,
        goerliFixedLenderWBTC,
        goerliFixedLenderWSTETH,
      ],
      Auditor: goerliAuditor,
      Previewer: goerliPreviewer,
    },
    mainnet: {
      FixedLenders: [
        mainnetFixedLenderDAI,
        mainnetFixedLenderUSDC,
        mainnetFixedLenderWETH,
        mainnetFixedLenderWBTC,
        mainnetFixedLenderWSTETH,
      ],
      Auditor: mainnetAuditor,
      Previewer: mainnetPreviewer,
    },
    homestead: {
      // HACK - remove this name and use chainId instead of network names
      FixedLenders: [
        mainnetFixedLenderDAI,
        mainnetFixedLenderUSDC,
        mainnetFixedLenderWETH,
        mainnetFixedLenderWBTC,
        mainnetFixedLenderWSTETH,
      ],
      Auditor: mainnetAuditor,
      Previewer: mainnetPreviewer,
    },
  };

  return dictionary[network || process.env.NEXT_PUBLIC_NETWORK!] ?? dictionary.goerli;
}

export default getABI;
