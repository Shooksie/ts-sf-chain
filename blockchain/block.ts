import { SHA256 } from "crypto-js";
import { DIFFICULTY, MINE_RATE } from "../config";
import { ChainUtil } from "../chain-util";

export class Block {
  private readonly timestamp: number;
  lastHash: string;
  hash: string;
  readonly data: any;
  private nonce: number;
  private difficulty: number;

  constructor(
    timestamp: number,
    lastHash: string,
    hash: string,
    data: any,
    nonce: number,
    difficulty: number = DIFFICULTY
  ) {
    this.timestamp = timestamp;
    this.hash = hash;
    this.lastHash = lastHash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  toString() {
    return `Block - 
            Timestamp:  ${this.timestamp}
            Last hash:  ${this.lastHash.substring(0, 10)}
            Hash:       ${this.hash.substring(0, 5)}
            Nonce:      ${this.nonce}
            DIFFICULTY: ${this.difficulty}
            Data:       ${this.data}`;
  }

  static genesis(): Block {
    return new this(0, "-----", "f1r57-h54h", [], 0, DIFFICULTY);
  }

  static mineBlock(lastBlock: Block, data: any): Block {
    const lastHash = lastBlock.hash;
    let hash, timestamp;
    let { difficulty } = lastBlock;
    let nonce = 0;

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty(lastBlock, timestamp);
      hash = Block.hash(timestamp, lastHash, data, nonce, difficulty);
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));

    return new this(timestamp, lastHash, hash, data, nonce, difficulty);
  }

  static hash(timestamp, lastHash, data, nonce, difficulty) {
    return ChainUtil.hash(
      `${timestamp}${lastHash}${data}${nonce}${difficulty}`
    ).toString();
  }

  static blockHash(block: Block) {
    const { timestamp, lastHash, data, nonce, difficulty } = block;

    return Block.hash(timestamp, lastHash, data, nonce, difficulty);
  }

  static adjustDifficulty(lastBlock: Block, currentTime: number) {
    let { difficulty } = lastBlock;
    return lastBlock.timestamp + MINE_RATE > currentTime
      ? difficulty + 1
      : difficulty - 1;
  }
}
