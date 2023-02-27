import { cwd } from 'process';
import { runTypeChain } from 'typechain';
import { readFile, writeFile, mkdir } from 'fs/promises';

const readABI = async (path: string) => JSON.parse((await readFile(path)).toString()).abi;

const writeABI = async (path: string, abi: unknown) => {
  await writeFile(path, JSON.stringify(abi, null, 2));
  return path;
};

void Promise.all([
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/DAI.json'),
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/Auditor.json'),
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/Previewer.json'),
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/MarketDAI.json'),
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/MarketETHRouter.json'),
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/InterestRateModelDAI.json'),
  readABI('node_modules/@exactly-protocol/protocol/deployments/goerli/RewardsController.json'),
  mkdir('abi', { recursive: true }),
]).then(async ([erc20, auditor, previewer, market, marketETHRouter, irm, rewards]) => {
  const allFiles = await Promise.all([
    writeABI('abi/ERC20.json', erc20),
    writeABI('abi/Market.json', market),
    writeABI('abi/Auditor.json', auditor),
    writeABI('abi/Previewer.json', previewer),
    writeABI('abi/MarketETHRouter.json', marketETHRouter),
    writeABI('abi/InterestRateModel.json', irm),
    writeABI('abi/RewardsController.json', rewards),
  ]);
  await runTypeChain({
    cwd: cwd(),
    allFiles,
    filesToProcess: allFiles,
    outDir: 'types/contracts',
    target: 'ethers-v5',
  });
});
