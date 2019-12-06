const Connector = require("@walletconnect/core").default;
const crypto = require("./crypto");

const clientMeta = {
  description: "WalletConnect Truffle Provider",
  url: "https://walletconnect.org",
  icons: ["https://walletconnect.org/walletconnect-logo.png"],
  name: "WalletConnectTruffle"
};

class WalletConnect extends Connector {
  constructor(opts) {
    super(crypto, opts, null, null, clientMeta);
    Object.defineProperty(this, "clientMeta", {
      get: () => clientMeta
    });
  }
}

module.exports = WalletConnect;
