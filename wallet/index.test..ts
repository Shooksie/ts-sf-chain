import { Wallet } from "./index";
import { TransactionPool } from "./transaction-pool";
import { Transaction } from "./transaction";
import { Blockchain } from "../blockchain";
import { INITIAL_BALANCE } from "../config";

describe("Wallet", () => {
  let wallet: Wallet, tp: TransactionPool, blockchain: Blockchain;

  beforeEach(() => {
    wallet = new Wallet();
    tp = new TransactionPool();
    blockchain = new Blockchain();
  });

  describe("creating a transaction", () => {
    let transaction: Transaction, sendAmount: number, recipient: string;

    beforeEach(() => {
      sendAmount = 50;
      recipient = "r4nd0m-4ddr355";
      transaction = wallet.createTransaction(
        recipient,
        sendAmount,
        blockchain,
        tp
      );
    });

    describe("and doing the same transaction", () => {
      beforeEach(() => {
        wallet.createTransaction(recipient, sendAmount, blockchain, tp);
      });

      it("doubles the `sendAmount` subtracted from the wallet balance", () => {
        expect(
          transaction.outputs.find(
            (output) => output.address === wallet.publicKey
          ).amount
        ).toEqual(wallet.balance - sendAmount * 2);
      });

      it("clones the `sendAmount` output from the recipient", () => {
        expect(
          transaction.outputs
            .filter((output) => output.address === wallet.publicKey)
            .map((output) => output.amount)
        ).toEqual([sendAmount, sendAmount]);
      });
    });
  });

  describe("calculating a balance", () => {
    let addBalance, repeatAdd, senderWallet;

    beforeEach(() => {
      senderWallet = new Wallet();
      addBalance = 100;
      repeatAdd = 3;

      for (let i = 0; i < repeatAdd; i++) {
        senderWallet.createTransaction(
          wallet.publicKey,
          addBalance,
          blockchain,
          tp
        );
      }
      blockchain.addBlock(tp.transactions);
    });

    it("calculates the balance for the blockchain transactions matching the recipient", () => {
      expect(wallet.calculateBalance(blockchain)).toEqual(
        INITIAL_BALANCE + addBalance * repeatAdd
      );
    });

    it("calculates the balance for the blockchain sender", () => {
      expect(senderWallet.calculateBalance(blockchain)).toEqual(
        INITIAL_BALANCE - addBalance * repeatAdd
      );
    });

    describe("the recipient conducts a transaction", () => {
      let subtractBalance, recipientBalance;

      beforeEach(() => {
        tp.clear();
        subtractBalance = 60;
        recipientBalance = wallet.calculateBalance(blockchain);
        wallet.createTransaction(
          senderWallet.publicKey,
          subtractBalance,
          blockchain,
          tp
        );

        blockchain.addBlock(tp.transactions);
      });

      describe("and the sender sends another transaction to the recipient", () => {
        beforeEach(() => {
          tp.clear();
          senderWallet.createTransaction(
            wallet.publicKey,
            addBalance,
            blockchain,
            tp
          );
          blockchain.addBlock(tp.transactions);
        });

        it("calculates the recipient balance only using transactions since it's most recent one", () => {
          expect(wallet.calculateBalance(blockchain)).toEqual(
            recipientBalance - subtractBalance + addBalance
          );
        });
      });
    });
  });
});
