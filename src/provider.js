WebSocket = require("ws");

const ProviderEngine = require("web3-provider-engine");
const FiltersSubprovider = require("web3-provider-engine/subproviders/filters.js");
const NonceSubProvider = require("web3-provider-engine/subproviders/nonce-tracker.js");
const HookedSubprovider = require("web3-provider-engine/subproviders/hooked-wallet.js");
const ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
const Web3 = require("web3");

const WalletConnect = require("./walletConnect");
const qrcode = require("qrcode-terminal");

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
        console.log("connect", error);
        reject(error);
        return;
      }

      const { accounts } = payload.params[0];
      console.log(`Wallet connected, using address ${accounts[0]}`);
      resolve(accounts);
    });
    walletConnector.on("session_update", (error, payload) => {
      console.log("session_update", error);

      const { accounts, chainId } = payload.params[0];
    });
    walletConnector.on("disconnect", (error, payload) => {
      console.log("disconnect", error);
      reject(error);
    });
  });
}

HDWalletProvider.prototype.connect = async function() {
  walletConnector = this.walletConnector;
  if (!walletConnector.connected) {
    await walletConnector.createSession();
    const { uri } = walletConnector;
    console.log("WalletConnect URI: ", uri);
    console.log("\nScan this QR with your WalletConnect-compatible wallet: \n");
    await showQR(uri);
    console.log("Waiting for the message to be signed");
    this.accounts = await connect(walletConnector);
  }
  return this.accounts;
};

function HDWalletProvider(provider, shareNonce = true) {
  this.walletConnector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org"
  });
  connecting = this.connect();

  this.engine = new ProviderEngine();
  this.engine.addProvider(
    new HookedSubprovider({
      getAccounts: function(cb) {
        connecting.then(accounts => cb(null, accounts));
      },
      signTransaction: function(txParams, cb) {
        // let pkey;
        // const from = txParams.from.toLowerCase();
        // if (tmp_wallets[from]) {
        //   pkey = tmp_wallets[from].getPrivateKey();
        // } else {
        //   cb("Account not found");
        // }
        // const tx = new Transaction(txParams);
        // tx.sign(pkey);
        // const rawTx = "0x" + tx.serialize().toString("hex");
        // cb(null, rawTx);
      },
      signMessage(message, cb) {
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
      new ProviderSubprovider(new Web3.providers.HttpProvider(provider))
    );
  } else {
    this.engine.addProvider(new ProviderSubprovider(provider));
  }
  this.engine.start(); // Required by the provider engine.
}

HDWalletProvider.prototype.sendAsync = function() {
  this.engine.sendAsync.apply(this.engine, arguments);
};

HDWalletProvider.prototype.send = function() {
  return this.engine.send.apply(this.engine, arguments);
};

// // returns the address of the given address_index, first checking the cache
// HDWalletProvider.prototype.getAddress = function(idx) {
//   // debug("getting addresses", this.addresses[0], idx);
//   // if (!idx) {
//   //   return this.addresses[0];
//   // } else {
//   //   return this.addresses[idx];
//   // }
// };

// // returns the addresses cache
// HDWalletProvider.prototype.getAddresses = function() {
//   // return this.addresses;
// };

module.exports = HDWalletProvider;
