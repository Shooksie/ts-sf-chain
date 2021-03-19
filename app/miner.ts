import { Blockchain } from "../blockchain";
import { TransactionPool } from "../wallet/transaction-pool";
import { Wallet } from "../wallet";
import P2p from "./p2p";
import { Transaction } from "../wallet/transaction";

export class Miner {
  private blockchain: Blockchain;
  private transactionPool: TransactionPool;
  private wallet: Wallet;
  private p2pServer: P2p;
  constructor(
    blockchain: Blockchain,
    transactionPool: TransactionPool,
    wallet: Wallet,
    p2pServer: P2p
  ) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.p2pServer = p2pServer;
  }

  mine() {
    const validTransactions = this.transactionPool.validTransactions();
    if (validTransactions.length) {
      validTransactions.push(
        Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet())
      );
      // include a reward for the miner
      const block = this.blockchain.addBlock(validTransactions);
      this.p2pServer.syncChains();
      this.transactionPool.clear();
      this.p2pServer.broadcastClearTransactions();
      // broadcast to every minor to clear their transaction pools

      return block;
    }
  }
}
