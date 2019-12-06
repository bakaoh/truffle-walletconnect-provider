const Connector = require("@walletconnect/core").default;
const crypto = require("./crypto");

const clientMeta = {
  description: "WalletConnect Bakaoh",
  url: "https://bakaoh.com",
  name: "Bakaoh"
};

const walletOptions = {
  clientMeta: {
    // Required
    description: "WalletConnect Developer App",
    url: "https://walletconnect.org",
    icons: ["https://walletconnect.org/walletconnect-logo.png"],
    name: "WalletConnect",
    ssl: true
  },
  push: {
    // Optional
    url: "https://push.walletconnect.org",
    type: "fcm",
    token: "dsdffdfgffgddsfcddsffg",
    peerMeta: true,
    language: "en"
  }
};

class WalletConnect extends Connector {
  constructor(opts) {
    super(crypto, opts, null, null, walletOptions.clientMeta);
    // if (walletOptions.push) {
    //   this.registerPushServer(walletOptions.push);
    // }
    Object.defineProperty(this, "clientMeta", {
      get: () => clientMeta
    });
  }

  registerPushServer(push) {
    if (!push.url || typeof push.url !== "string") {
      throw Error("Invalid or missing push.url parameter value");
    }

    if (!push.type || typeof push.type !== "string") {
      throw Error("Invalid or missing push.type parameter value");
    }

    if (!push.token || typeof push.token !== "string") {
      throw Error("Invalid or missing push.token parameter value");
    }

    const pushSubscription = {
      bridge: this.bridge,
      topic: this.clientId,
      type: push.type,
      token: push.token,
      peerName: "",
      language: push.language || ""
    };

    this.on("connect", (error, payload) => {
      if (error) {
        throw error;
      }

      if (push.peerMeta) {
        const peerName = payload.params[0].peerMeta.name;
        pushSubscription.peerName = peerName;
      }

      this.postClientDetails(push.url, pushSubscription);
    });
  }

  async postClientDetails(url, pushSubcription) {
    try {
      const response = await fetch(`${url}/new`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pushSubcription)
      });

      const json = await response.json();
      if (!json.success) {
        throw Error("Failed to register push server");
      }
    } catch (error) {
      throw Error("Failed to register push server");
    }
  }
}

module.exports = WalletConnect;
