require("dotenv").config();
const { ethers } = require("ethers");

// connect to RPC node
const provider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL);

// the address that will send the test transaction
const privateKey = new Buffer.from(process.env.PRIVATE_KEY, "hex");
const wallet = new ethers.Wallet(privateKey).connect(provider);

// construct the transaction data
// NOTE: property 'nonce' must be merged in from web3.eth.getTransactionCount
// before the transaction data is passed to new Tx(); see sendRawTransaction below.
const txData = {
  chainId: 3311,
  gasLimit: ethers.utils.hexlify(25000),
  gasPrice: ethers.utils.parseUnits("1", "gwei"), // 1 Gwei
  to: "0xff93B45308FD417dF303D6515aB04D9e89a750Ca",
  // value: ethers.utils.parseEther("0.1"), // thanks @abel30567
  // if you want to send raw data (e.g. contract execution) rather than sending tokens,
  // use 'data' instead of 'value' (thanks @AlecZadikian9001)
  // e.g. myContract.methods.myMethod(123).encodeABI() (thanks @NguyenHoangSon96)
  data: "0x00",
};

/** Signs the given transaction data and sends it. Abstracts some of the details of
 * buffering and serializing the transaction for web3.
 * @returns A promise of an object that emits events: transactionHash, receipt, confirmaton, error
 */
const sendRawTransaction = async (txData) => {
  // get the number of transactions sent so far so we can create a fresh nonce
  const txCount = await wallet.getTransactionCount();
  console.log("transactionCount:", txCount);

  // construct transaction with nonce
  const tx = { ...txData, nonce: txCount };

  // sign and serialize the transaction with privateKey
  const serializedTx = await wallet
    .signTransaction(tx)
    .then(ethers.utils.serializeTransaction(tx));

  console.log(`Signed Raw Transaction: ${serializedTx}`);

  return sendSignedRawTransaction(serializedTx);
};

const sendSignedRawTransaction = async (serializedTx) => {
  // broadcast the raw transaction over the network
  const { hash } = await provider.sendTransaction(serializedTx);
  console.log(`Transaction Hash: ${hash}`);
  console.log("Waiting for the transaction to be included into block...");

  // wait for confirmations
  return provider.waitForTransaction(hash);
};

// fire away!
// (thanks @AndreiD)
sendRawTransaction(txData).then(console.log);
// sendSignedRawTransaction("hex").then(console.log);
