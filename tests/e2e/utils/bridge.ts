import { Eip1193Bridge } from '@ethersproject/experimental';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';

export class CustomizedBridge extends Eip1193Bridge {
  chainId: number;

  constructor(signer: Signer, provider: Provider, chainId?: number) {
    super(signer, provider);
    this.chainId = chainId ?? 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async send(method: string, params: Array<any>): Promise<any> {
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [await this.signer.getAddress()];

      case 'eth_chainId':
        return this.chainId;

      case 'eth_sendTransaction': {
        if (!this.signer) {
          throw new Error('eth_sendTransaction requires an account');
        }

        const req = JsonRpcProvider.hexlifyTransaction(params[0], { from: true, gas: true });
        const tx = await this.signer.sendTransaction(req);
        return tx.hash;
      }

      case 'eth_call': {
        if (!this.signer) {
          throw new Error('eth_call requires an account');
        }

        const req = JsonRpcProvider.hexlifyTransaction(params[0], { from: true, gas: true });
        return await this.signer.call(req, params[1]);
      }

      default:
        return await super.send(method, params);
    }
  }
}
