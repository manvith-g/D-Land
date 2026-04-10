import algosdk from "algosdk";

const ALGOD_SERVER  = "https://testnet-api.algonode.cloud";
const ALGOD_PORT    = "";
const ALGOD_TOKEN   = "";
const BACKEND_URL   = "http://localhost:5000/api";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export async function connectPeraWallet(peraWallet) {
  const accounts = await peraWallet.connect();
  return accounts[0];
}

export async function optIntoAsset(senderAddress, assetId, peraWallet) {
  const sp  = await algodClient.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from:            senderAddress,
    to:              senderAddress,
    assetIndex:      assetId,
    amount:          0,
    suggestedParams: sp,
  });

  const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [senderAddress] }]]);
  const { txId }   = await algodClient.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  return txId;
}

export async function buyProperty(buyerAddress, appId, assetId, priceInMicroAlgo, peraWallet) {
  const sp         = await algodClient.getTransactionParams().do();
  const appAddress = algosdk.getApplicationAddress(appId);

  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from:            buyerAddress,
    appIndex:        appId,
    appArgs:         [new TextEncoder().encode("buy")],
    foreignAssets:   [assetId],
    suggestedParams: sp,
  });

  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from:            buyerAddress,
    to:              appAddress,
    amount:          priceInMicroAlgo,
    suggestedParams: sp,
  });

  algosdk.assignGroupID([appCallTxn, paymentTxn]);

  const signedTxns = await peraWallet.signTransaction([
    [{ txn: appCallTxn, signers: [buyerAddress] }],
    [{ txn: paymentTxn, signers: [buyerAddress] }],
  ]);

  const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  return txId;
}

export async function fetchListings() {
  const res = await fetch(`${BACKEND_URL}/listings`);
  return res.json();
}

export async function fetchContractState(appId) {
  const res = await fetch(`${BACKEND_URL}/contract/${appId}/state`);
  return res.json();
}

export async function addListing(listing) {
  const res = await fetch(`${BACKEND_URL}/listings`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(listing),
  });
  return res.json();
}

export const toAlgo     = (micro) => (micro / 1_000_000).toFixed(4);
export const toMicroAlgo = (algo) => Math.floor(algo * 1_000_000);