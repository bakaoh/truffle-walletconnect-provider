WebSocket = require("ws");

const Web3 = require("web3");
const qrcode = require("qrcode-terminal");
const chalk = require("chalk");
const ProviderEngine = require("web3-provider-engine");
const FiltersSubprovider = require("web3-provider-engine/subproviders/filters.js");
const NonceSubProvider = require("web3-provider-engine/subproviders/nonce-tracker.js");
const HookedSubprovider = require("web3-provider-engine/subproviders/hooked-wallet.js");
const ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
const WalletConnect = require("./walletConnect");

const singletonNonceSubProvider = new NonceSubProvider();

function showQR(uri) {
  return new Promise(resolve => {
    qrcode.generate(uri, { small: true }, qr => {
      console.log(`> Scan this QR with your WalletConnect-compatible wallet:`);
      console.log(`\nURI: ${uri}\n`);
      console.log(qr);
      resolve();
    });
  });
}

function connect(walletConnector) {
  console.log(chalk.blue("Waiting for the message to be signed"));
  return new Promise((resolve, reject) => {
    walletConnector.on("connect", (error, payload) => {
      if (error) {
        reject(error);
        return;
      }
      const { accounts } = payload.params[0];
      console.log(chalk.blue(`Wallet connected, using address ${accounts[0]}`));
      resolve();
    });
  });
}

class WalletConnectProvider {
  constructor(provider, shareNonce = true) {
    this.walletConnector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org"
    });

    this.engine = new ProviderEngine();
    this.engine.addProvider(
      new HookedSubprovider({
        getAccounts: cb => this.getAccounts(cb),
        signTransaction: (txParams, cb) => this.signTransaction(txParams, cb),
        signMessage: (message, cb) => this.signMessage(message, cb)
      })
    );
    this.engine.addProvider(
      shareNonce ? singletonNonceSubProvider : new NonceSubProvider()
    );
    this.engine.addProvider(new FiltersSubprovider());
    this.engine.addProvider(
      new ProviderSubprovider(
        typeof provider === "string"
          ? new Web3.providers.HttpProvider(provider, { keepAlive: false })
          : provider
      )
    );
    this.engine.start(); // Required by the provider engine.
  }

  sendAsync() {
    this.engine.sendAsync.apply(this.engine, arguments);
  }

  send() {
    return this.engine.send.apply(this.engine, arguments);
  }

  async getConnector() {
    const wc = this.walletConnector;
    if (!wc.connected) {
      await wc.createSession();
      await showQR(wc.uri);
      await connect(wc);
      wc.on("session_update", (error, payload) => {});
      wc.on("disconnect", (error, payload) => {
        console.log(chalk.red("\nDisconnected from your wallet\n"));
        this.engine.stop();
        process.exit(1);
      });
    }
    return wc;
  }

  async getAccounts(cb) {
    try {
      const wc = await this.getConnector();
      cb(null, wc.accounts);
    } catch (err) {
      cb(err);
    }
  }

  async signTransaction(txParams, cb) {
    try {
      const wc = await this.getConnector();
      console.log(chalk.blue("\nApprove request using your wallet\n"));
      const result = await wc.signTransaction({
        from: txParams.from.toLowerCase(),
        to: txParams.to ? txParams.to.toLowerCase() : "0x",
        gasLimit: txParams.gas,
        gasPrice: txParams.gasPrice,
        value: txParams.value || "0x00",
        data: txParams.data,
        nonce: txParams.nonce
      });
      cb(null, result);
    } catch (err) {
      cb(err);
    }
  }

  async signMessage(message, cb) {
    try {
      const wc = await this.getConnector();
      console.log(chalk.blue("\nApprove request using your wallet\n"));
      const result = await wc.signMessage([message.from, message.data]);
      cb(null, result);
    } catch (err) {
      cb(err);
    }
  }
}

module.exports = WalletConnectProvider;
