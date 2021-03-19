import { ChainUtil } from "../chain-util";
import { Wallet } from "./index";
import { MINING_REWARD } from "../config";

interface TransactionInput {
  timestamp: number;
  amount: number;
  address: string;
  signature: string;
}

interface TransactionOutput {
  amount: number;
  address: string;
}
export class Transaction {
  id: any;
  public input: TransactionInput | null;
  public outputs: TransactionOutput[];

  constructor() {
    this.id = ChainUtil.id();
    this.input = null;
    this.outputs = [];
  }

  update(senderWallet: Wallet, recipient: string, amount): Transaction {
    const senderOutput = this.outputs.find(
      (output) => output.address === senderWallet.publicKey
    );

    if (amount > senderOutput.amount) {
      console.log(`Amount: ${amount} exceeds balance`);
      return;
    }
    senderOutput.amount = senderOutput.amount - amount;
    this.outputs.push({ amount, address: recipient });
    Transaction.signTransaction(this, senderWallet);

    return this;
  }

  static transactionWithOutput(
    senderWallet: Wallet,
    outputs: TransactionOutput[]
  ): Transaction {
    const transaction = new this();

    transaction.outputs.push(...outputs);
    Transaction.signTransaction(transaction, senderWallet);

    return transaction;
  }
  static newTransaction(
    senderWallet: Wallet,
    recipientWallet: string,
    amount: number
  ) {
    if (amount > senderWallet.balance) {
      console.log(`Amount: ${amount} exceeds balance.`);
      return;
    }

    return Transaction.transactionWithOutput(senderWallet, [
      {
        amount: senderWallet.balance - amount,
        address: senderWallet.publicKey,
      },
      { amount, address: recipientWallet },
    ]);
  }

  static rewardTransaction(minerWallet: Wallet, blockchainWallet: Wallet) {
    return Transaction.transactionWithOutput(blockchainWallet, [
      {
        amount: MINING_REWARD,
        address: minerWallet.publicKey,
      },
    ]);
  }

  static signTransaction(transaction, senderWallet: Wallet) {
    transaction.input = {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(ChainUtil.hash(transaction.outputs)),
    };
  }

  static verifyTransaction(transaction) {
    return ChainUtil.verifySignature(
      transaction.input.address,
      transaction.input.signature,
      ChainUtil.hash(transaction.outputs)
    );
  }
}
