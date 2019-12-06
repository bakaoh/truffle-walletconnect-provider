WebSocket = require("ws");

const Web3 = require("web3");
const qrcode = require("qrcode-terminal");
const chalk = require('chalk');
const ProviderEngine = require("web3-provider-engine");
const FiltersSubprovider = require("web3-provider-engine/subproviders/filters.js");
const NonceSubProvider = require("web3-provider-engine/subproviders/nonce-tracker.js");
const HookedSubprovider = require("web3-provider-engine/subproviders/hooked-wallet.js");
const ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
const WalletConnect = require("./walletConnect");

const singletonNonceSubProvider = new NonceSubProvider();

function showQR(data) {
  return new Promise(resolve => {
    qrcode.generate(data, { small: true }, qr => {
      console.log(qr);
      resolve();
    });
  });
}

async function connect(walletConnector) {
  return new Promise((resolve, reject) => {
    walletConnector.on("connect", (error, payload) => {
      if (error) {
        reject(error);
        return;
      }

      const { accounts } = payload.params[0];
      console.log(chalk.blue(`Wallet connected, using address ${accounts[0]}`));
      resolve(accounts);
    });
    walletConnector.on("session_update", (error, payload) => {
      const { accounts, chainId } = payload.params[0];
    });
    walletConnector.on("disconnect", (error, payload) => {
      console.log("disconnect", error);
      reject(error);
    });
  });
}

WalletConnectProvider.prototype.connect = async function() {
  walletConnector = this.walletConnector;
  if (!walletConnector.connected) {
    await walletConnector.createSession();
    const { uri } = walletConnector;
    console.log("> Scan this QR with your WalletConnect-compatible wallet: \n");
    console.log(`URI: ${uri}\n`);
    await showQR(uri);
    console.log(chalk.blue("Waiting for the message to be signed"));
    this.accounts = await connect(walletConnector);
  }
  return Promise.resolve(this.accounts);
};

function WalletConnectProvider(provider, shareNonce = true) {
  let walletConnector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org"
  });
  this.walletConnector = walletConnector;
  // let connecting = this.connect();

  let that = this;
  this.engine = new ProviderEngine();
  this.engine.addProvider(
    new HookedSubprovider({
      getAccounts: function(cb) {
        that
          .connect()
          .then(accounts => {
            cb(null, accounts);
          })
          .catch(e => cb(e));
      },
      signTransaction: function(txParams, cb) {
        console.log(chalk.blue("\nApprove or reject request using your wallet\n"));
        walletConnector
          .signTransaction({
            from: txParams.from.toLowerCase(),
            to: txParams.to ? txParams.to.toLowerCase() : "0x",
            gasLimit: txParams.gas, // Required
            gasPrice: txParams.gasPrice, // Required
            value: "0x00", // Required
            data: txParams.data, // Required
            nonce: txParams.nonce // Required
          })
          .then(r => {
            cb(null, r);
          })
          .catch(e => {
            cb(e);
          });
      },
      signMessage(message, cb) {
        console.log("message", message);
        that
          .connect()
          .then(() => {
            cb(null, "sdkflsd");
          })
          .catch(e => console.log(e));
        // const dataIfExists = message.data;
        // if (!dataIfExists) {
        //   cb("No data to sign");
        // }
        // if (!tmp_wallets[message.from]) {
        //   cb("Account not found");
        // }
        // let pkey = tmp_wallets[message.from].getPrivateKey();
        // const dataBuff = ethUtil.toBuffer(dataIfExists);
        // const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        // const sig = ethUtil.ecsign(msgHashBuff, pkey);
        // const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
        // cb(null, rpcSig);
      }
    })
  );

  !shareNonce
    ? this.engine.addProvider(new NonceSubProvider())
    : this.engine.addProvider(singletonNonceSubProvider);

  this.engine.addProvider(new FiltersSubprovider());
  if (typeof provider === "string") {
    this.engine.addProvider(
      new ProviderSubprovider(
        new Web3.providers.HttpProvider(provider, { keepAlive: false })
      )
    );
  } else {
    this.engine.addProvider(new ProviderSubprovider(provider));
  }
  this.engine.start(); // Required by the provider engine.
}

WalletConnectProvider.prototype.sendAsync = function() {
  this.engine.sendAsync.apply(this.engine, arguments);
};

WalletConnectProvider.prototype.send = function() {
  return this.engine.send.apply(this.engine, arguments);
};

module.exports = WalletConnectProvider;
