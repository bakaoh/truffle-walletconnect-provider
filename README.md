# truffle-walletconnect-provider

[![npm](https://img.shields.io/npm/v/truffle-walletconnect-provider.svg)](https://www.npmjs.com/package/truffle-walletconnect-provider)

WalletConnect-enabled Web3 provider. Use it to sign transactions using WalletConnect-compatible wallet

## Install

```
$ npm install truffle-walletconnect-provider
```

## Requirements
```
Node >= 7.6
Web3 ^1.2.0
```

## General Usage

You can use this provider wherever a Web3 provider is needed, not just in Truffle. For Truffle-specific usage, see next section.

```javascript
const WalletConnectProvider = require("truffle-walletconnect-provider");
const Web3 = require("web3");

let provider = new WalletConnectProvider("http://localhost:8545");

// WalletConnectProvider is compatible with Web3. Use it at Web3 constructor, just like any other Web3 Provider
const web3 = new Web3(provider);

// Or, if web3 is alreay initialized, you can call the 'setProvider' on web3, web3.eth, web3.shh and/or web3.bzz
web3.setProvider(provider)

// ...
// Write your code here.
// ...

// At termination, `provider.engine.stop()' should be called to finish the process elegantly.
provider.engine.stop();
```

Parameters:

| Parameter | Type | Default | Required | Description |
| ------ | ---- | ------- | ----------- | ----------- |
| `provider` | `string\|object` | `null` | [x] | URI or Ethereum client to send all other non-transaction-related Web3 requests |
| `shareNonce` | `boolean` | `true` | [ ] | If false, a new WalletProvider will track its own nonce-state |


## Truffle Usage

You can easily use this within a Truffle configuration. For instance:

truffle-config.js
```javascript
const WalletConnectProvider = require("truffle-walletconnect-provider");

let provider = new WalletProvider("https://ropsten.infura.io/v3/YOUR-PROJECT-ID");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: () => provider,
      network_id: '3',
    }
  }
};
```
