import { ec as EC } from "elliptic";
const ec = new EC("secp256k1");
import { v1 as uuidV1 } from "uuid";
import { SHA256 } from "crypto-js";

export class ChainUtil {
  static genKeyPair() {
    return ec.genKeyPair();
  }

  static id() {
    return uuidV1();
  }

  static hash(data) {
    return SHA256(JSON.stringify(data)).toString();
  }

  static verifySignature(publicKey: string, signature, dataHash) {
    return ec.keyFromPublic(publicKey, "hex").verify(dataHash, signature);
  }
}
