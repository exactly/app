import { Eip1193Bridge } from '@ethersproject/experimental';
import { Signer } from '@ethersproject/abstract-signer';

export class CustomizedBridge extends Eip1193Bridge {
  chainId: number;

  constructor(signer: Signer, chainId?: number) {
    super(signer);
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

        if (params.length !== 1) {
          throw new Error('eth_sendTransaction requires a transaction');
        }

        const { gas, ...rest } = params[0];
        const transaction = { gasLimit: gas, ...rest };

        const tx = await this.signer.sendTransaction(transaction);
        return tx.hash;
      }

      case 'eth_call': {
        if (!this.signer) {
          throw new Error('eth_call requires an account');
        }

        return await this.signer.call(params[0], params[1]);
      }

      default:
        return await super.send(method, params);
    }
  }
}
