import { INITIAL_BALANCE } from "../config";
import { ChainUtil } from "../chain-util";
import { TransactionPool } from "./transaction-pool";
import { Transaction } from "./transaction";
import { Blockchain } from "../blockchain";

export class Wallet {
  public publicKey: any;
  private keypair: any;
  public balance: number;
  private address: string;

  constructor() {
    this.balance = INITIAL_BALANCE;
    this.keypair = ChainUtil.genKeyPair();
    this.publicKey = this.keypair.getPublic().encode("hex");
  }

  toString() {
    return `Wallet - 
      publicKey: ${this.publicKey.toString()}
      balance: ${this.balance}
    `;
  }

  sign(dataHash) {
    return this.keypair.sign(dataHash);
  }

  createTransaction(
    recipient: string,
    amount: number,
    blockchain: Blockchain,
    transactionPool: TransactionPool
  ) {
    this.balance = this.calculateBalance(blockchain);
    if (amount > this.balance) {
      console.log(`Amount: ${amount} exceeds current balance: ${this.balance}`);
      return;
    }

    let transaction = transactionPool.existingTransaction(this.publicKey);

    if (transaction) {
      transaction.update(this, recipient, amount);
    } else {
      transaction = Transaction.newTransaction(this, recipient, amount);
      transactionPool.updateOrAddTransaction(transaction);
    }

    return transaction;
  }

  calculateBalance(blockchain: Blockchain) {
    let balance = this.balance;
    let walletInputTransactions = [];
    let transactions = [];

    blockchain.chain.forEach((block) =>
      block.data.forEach((transaction) => {
        transactions.push(transaction);
        if (transaction.input.address === this.publicKey)
          walletInputTransactions.push(transaction);
      })
    );

    let startTime = 0;
    if (walletInputTransactions.length > 0) {
      const recentInputT = walletInputTransactions.reduce((prev, current) =>
        prev.input.timestamp > current.input.timestamp ? prev : current
      );

      balance = recentInputT.outputs.find(
        (output) => output.address === this.publicKey
      ).amount;

      startTime = recentInputT.input.timestamp;
    }

    transactions.forEach((transaction) => {
      if (transaction.input.timestamp > startTime) {
        transaction.outputs.find((output) => {
          if (output.address === this.publicKey) {
            balance += output.amount;
          }
        });
      }
    });

    return balance;
  }

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = "blockchain-wallet";
    return blockchainWallet;
  }
}
