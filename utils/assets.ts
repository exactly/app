import { basename } from 'path';
import { readdir, readFile } from 'fs/promises';

export async function staticAssets(): Promise<string[]> {
  const deploymentsDir = 'node_modules/@exactly-protocol/protocol/deployments';
  const networks = await readdir(deploymentsDir);
  const markets = await Promise.all(
    networks.map(async (network) => {
      try {
        await readFile(`${deploymentsDir}/${network}/.chainId`);
        return (await readdir(`${deploymentsDir}/${network}`))
          .map((filename) => basename(filename, '.json'))
          .filter((name) => name.startsWith('Market') && !name.includes('_') && !name.includes('Router'))
          .map((name) => name.replace(/^Market/, ''));
      } catch {
        return [];
      }
    }),
  );

  return Array.from(new Set(markets.flat()));
}
