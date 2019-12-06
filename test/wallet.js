WebSocket = require("ws");

const WalletConnect = require("./walletConnect");
const { Transaction } = require("ethereumjs-tx");

let uri = "wc:28f6b387-77a2-467c-9e55-07ff20135b63@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=1cfbc7e41dabea4254f1c35cceda45f44f34f105f4d550fe8ca0546a4ab46cd3"
// Create WalletConnector
const walletConnector = new WalletConnect(
  { uri },
  {
    clientMeta: {
      // Required
      description: "WalletConnect Developer App",
      url: "https://walletconnect.org",
      icons: ["https://walletconnect.org/walletconnect-logo.png"],
      name: "WalletConnect",
      ssl: true
    }
  }
);

// Subscribe to session requests
walletConnector.on("session_request", (error, payload) => {
  if (error) {
    throw error;
  }

  // Handle Session Request

  walletConnector.approveSession({
    accounts: [
      "0x2D889b02422caeB2C2a338362c0Fb1a92aeF90B7",
      "0x088322bcf8311dC8BF4b166588b7186162019d10"
    ],
    chainId: 5777
  });
  /* payload:
  {
    id: 1,
    jsonrpc: '2.0'.
    method: 'session_request',
    params: [{
      peerId: '15d8b6a3-15bd-493e-9358-111e3a4e6ee4',
      peerMeta: {
        name: "WalletConnect Example",
        description: "Try out WalletConnect v1.0.0-beta",
        icons: ["https://example.walletconnect.org/favicon.ico"],
        url: "https://example.walletconnect.org",
        ssl: true
      }
    }]
  }
  */
});

// Subscribe to call requests
walletConnector.on("call_request", (error, payload) => {
  console.log("call_request", error, payload);

  if (error) {
    throw error;
  }

  if (payload.method !== "eth_signTransaction") {
    console.log(`Method '${payload.method}' is not supported`, payload);
    walletConnector.rejectRequest({
      id: payload.id,
      error: { message: `Method '${payload.method}' is not supported` }
    });
    return;
  }

  payload.params[0].to = payload.params[0].to || "0x";
  const tx = new Transaction(payload.params[0]);
  tx.sign(
    Buffer.from(
      "cc90ad96b5bac509225d6d429e030428b90777c73c6b958826933d489b6c8f9b",
      "hex"
    )
  );
  const rawTx = `0x${tx.serialize().toString("hex")}`;
  walletConnector.approveRequest({
    id: payload.id,
    result: rawTx
  });
  // Handle Call Request

  /* payload:
  {
    id: 1,
    jsonrpc: '2.0'.
    method: 'eth_sign',
    params: [
      "0xbc28ea04101f03ea7a94c1379bc3ab32e65e62d3",
      "My email is john@doe.com - 1537836206101"
    ]
  }
  */
});

walletConnector.on("disconnect", (error, payload) => {
  console.log("disconnect", error, payload);

  if (error) {
    throw error;
  }

  // Delete walletConnector
});
