const WalletProvider = require("../src");

let provider = new WalletProvider("http://127.0.0.1:7545");

module.exports = {

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },

    wallet: {
      provider: () => provider,
      network_id: "*"
    }
  },
};
