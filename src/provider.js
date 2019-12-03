const WalletConnect = require("./walletConnect");

async function HDWalletProvider(provider) {
  const walletConnector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org"
  });

  await walletConnector.createSession();
  const { uri } = walletConnector;
  console.log("WalletConnect URI: ", uri);

  console.log("\nScan this QR with your WalletConnect-compatible wallet: \n");
  await showQR(uri);
  // spinner.create('Waiting for the message to be signed')
  // await connect(walletConnector)

  return;
  if ((mnemonic && mnemonic.indexOf(" ") === -1) || Array.isArray(mnemonic)) {
    const privateKeys = Array.isArray(mnemonic) ? mnemonic : [mnemonic];
    this.wallets = {};
    this.addresses = [];

    for (let i = address_index; i < address_index + num_addresses; i++) {
      const privateKey = Buffer.from(privateKeys[i].replace("0x", ""), "hex");
      if (ethUtil.isValidPrivate(privateKey)) {
        const wallet = ethJSWallet.fromPrivateKey(privateKey);
        const address = wallet.getAddressString();
        this.addresses.push(address);
        this.wallets[address] = wallet;
      }
    }
  } else {
    this.mnemonic = mnemonic;
    this.hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
    this.wallet_hdpath = wallet_hdpath;
    this.wallets = {};
    this.addresses = [];

    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Mnemonic invalid or undefined");
    }

    for (let i = address_index; i < address_index + num_addresses; i++) {
      const wallet = this.hdwallet
        .derivePath(this.wallet_hdpath + i)
        .getWallet();
      const addr = "0x" + wallet.getAddress().toString("hex");
      this.addresses.push(addr);
      this.wallets[addr] = wallet;
    }
  }

  const tmp_accounts = this.addresses;
  const tmp_wallets = this.wallets;

  this.engine = new ProviderEngine();
  this.engine.addProvider(
    new HookedSubprovider({
      getAccounts: function(cb) {
        cb(null, tmp_accounts);
      },
      getPrivateKey: function(address, cb) {
        if (!tmp_wallets[address]) {
          return cb("Account not found");
        } else {
          cb(null, tmp_wallets[address].getPrivateKey().toString("hex"));
        }
      },
      signTransaction: function(txParams, cb) {
        let pkey;
        const from = txParams.from.toLowerCase();
        if (tmp_wallets[from]) {
          pkey = tmp_wallets[from].getPrivateKey();
        } else {
          cb("Account not found");
        }
        const tx = new Transaction(txParams);
        tx.sign(pkey);
        const rawTx = "0x" + tx.serialize().toString("hex");
        cb(null, rawTx);
      },
      signMessage(message, cb) {
        const dataIfExists = message.data;
        if (!dataIfExists) {
          cb("No data to sign");
        }
        if (!tmp_wallets[message.from]) {
          cb("Account not found");
        }
        let pkey = tmp_wallets[message.from].getPrivateKey();
        const dataBuff = ethUtil.toBuffer(dataIfExists);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        const sig = ethUtil.ecsign(msgHashBuff, pkey);
        const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
        cb(null, rpcSig);
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

// returns the address of the given address_index, first checking the cache
HDWalletProvider.prototype.getAddress = function(idx) {
  debug("getting addresses", this.addresses[0], idx);
  if (!idx) {
    return this.addresses[0];
  } else {
    return this.addresses[idx];
  }
};

// returns the addresses cache
HDWalletProvider.prototype.getAddresses = function() {
  return this.addresses;
};

module.exports = HDWalletProvider;
