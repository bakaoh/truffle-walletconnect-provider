import Connector from "@walletconnect/core";
import * as crypto from "./crypto";

export class WalletConnect extends Connector {
  constructor(opts) {
    super(crypto, opts);
  }
}
