import {
  Message,
  SignedMessage,
  transactionSign,
  transactionSignRaw
} from "@zondax/filecoin-signing-tools/js";
import {Wallet} from "../interfaces";
import {getKeyPair} from "../filecoin/account";
import {showConfirmationDialog} from "../util/confirmation";
import {LotusRpcApi} from "../filecoin/types";
import {PartialMessage} from "@nodefactory/metamask-filecoin-types";

export async function signMessage(
  wallet: Wallet, api: LotusRpcApi, partialMessage: PartialMessage
): Promise<SignedMessage> {
  const keypair = await getKeyPair(wallet);
  const message: Message = {
    ...partialMessage,
    from: keypair.address,
    gaslimit: partialMessage.gaslimit || 10000,
    gasprice: partialMessage.gasprice || "0",
    method: 0, // code for basic transaction
    nonce: Number(await api.mpoolGetNonce(keypair.address))
  };
  const stateCallResponse = await api.stateCall(message, null);
  if (stateCallResponse.ExecutionTrace.MsgRct.GasUsed > message.gaslimit) {
    // TODO - error
  }
  const confirmation = await showConfirmationDialog(
    wallet,
    `Do you want to sign message\n\n` +
    `from: ${message.from}\n`+
    `to: ${message.to}\n`+
    `value:${message.value}\n`+
    `gas limit:${message.gaslimit}\n`+
    `gas price:${message.gasprice}\n\n` +
    `with account ${keypair.address}?`
  );
  if (confirmation) {
    return transactionSign(message, keypair.privateKey);
  }
  return null;
}

export async function signMessageRaw(wallet: Wallet, rawMessage: string): Promise<string> {
  const keypair = await getKeyPair(wallet);
  const confirmation = await showConfirmationDialog(
    wallet,
    `Do you want to sign message\n\n` +
      `${rawMessage}\n\n`+
      `with account ${keypair.address}?`
  );
  if (confirmation) {
    return transactionSignRaw(rawMessage, keypair.privateKey).toString("hex");
  }
  return null;
}