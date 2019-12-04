WebSocket = require("ws");

const WalletConnect = require("./walletConnect");
const qrcode = require("qrcode-terminal");

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
      console.log("connect", error, payload);

      if (error) {
        console.log("connect", error);
        reject(error);
        return;
      }
      console.log(payload);
      //   const { accounts } = payload.params[0];
      //   console.log(`Wallet connected, using address ${accounts[0]}`);
      resolve();
    });
    walletConnector.on("session_update", (error, payload) => {
      console.log("session_update", error, payload);

      const { accounts, chainId } = payload.params[0];
    });
    walletConnector.on("disconnect", (error, payload) => {
      console.log("disconnect", error, payload);
      reject(error);
    });
  });
}

async function test() {
  walletConnector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org"
  });
  await walletConnector.createSession({ chainId: 1 });
  const { uri } = walletConnector;
  console.log("WalletConnect URI: ", uri);
  console.log("\nScan this QR with your WalletConnect-compatible wallet: \n");
  await showQR(uri);
  console.log("Waiting for the message to be signed");
  await connect(walletConnector);
}

test().catch(e => console.log(e));
