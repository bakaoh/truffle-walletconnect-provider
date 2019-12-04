const Connector = require("@walletconnect/core").default;
const crypto = require("./crypto");

const clientMeta = {
  description: "WalletConnect Bakaoh",
  url: "https://bakaoh.com",
  name: "Bakaoh"
};

class WalletConnect extends Connector {
  constructor(opts) {
    super(crypto, opts, null, null, clientMeta);
  }
}

module.exports = WalletConnect;
