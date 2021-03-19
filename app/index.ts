import express = require("express");
import bodyParser = require("body-parser");
import { Blockchain } from "../blockchain";
import P2pServer from "./p2p";
import { TransactionPool } from "../wallet/transaction-pool";
import { Wallet } from "../wallet";
import { Miner } from "./miner";

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();

const blockchain = new Blockchain();

const wallet = new Wallet();

const tp = new TransactionPool();
const p2pServer = new P2pServer(blockchain, tp);
const miner = new Miner(blockchain, tp, wallet, p2pServer);

app.use(bodyParser.json());

app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.post("/mine", (req, res) => {
  const block = blockchain.addBlock(req.body.data);

  console.log(`New block added: ${block.toString()}`);
  p2pServer.syncChains();
  res.redirect("/blocks");
});

app.get("/transactions", (req, res) => {
  res.json(tp.transactions);
});

app.post("/transact", (req, res) => {
  const { recipient, amount } = req.body;
  const transaction = wallet.createTransaction(
    recipient,
    amount,
    blockchain,
    tp
  );
  p2pServer.broadcastTransaction(transaction);
  res.redirect("/transactions");
});

app.get("/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

app.get("/mine-transactions", (req, res) => {
  const block = miner.mine();
  if (block) {
    console.log(`New block added: ${block.toString()}`);
  }
  res.redirect("/blocks");
});
app.listen(HTTP_PORT, () => console.log(`listening on port: ${HTTP_PORT}`));
p2pServer.listen();
