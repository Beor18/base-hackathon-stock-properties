import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  type Account,
  type Address,
  type Chain,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, foundry } from "viem/chains";

import { NETWORKS, SOURCES, type NetworkName } from "./deploy-config";

const CHAINS: Record<NetworkName, Chain> = { local: foundry, "base-sepolia": baseSepolia, base };

/**
 * Read-only Base mainnet client, used on every network for live prices and asset checks.
 * Concurrent reads are folded into Multicall3 calls so the public RPC is not hit in bursts.
 */
export function createMainnetClient() {
  return createPublicClient({
    chain: base,
    batch: { multicall: true },
    transport: http(SOURCES.baseMainnetRpc, { retryCount: 5, retryDelay: 500 }),
  });
}

export type Signer = {
  network: NetworkName;
  chain: Chain;
  rpcUrl: string;
  publicClient: PublicClient;
  walletClient: WalletClient<ReturnType<typeof http>, Chain, Account>;
  /** Other unlocked accounts (local only), in node order after the deployer. */
  extraAccounts: Address[];
};

/**
 * Connects to the target network. Local uses Anvil's unlocked accounts (no keys in code); public
 * networks sign with `DEPLOYER_PRIVATE_KEY`, the only secret the scripts read.
 */
export async function connect(network: NetworkName, rpcUrl: string = NETWORKS[network].rpcUrl): Promise<Signer> {
  const chain = CHAINS[network];
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain, transport });

  let chainId: number;
  try {
    chainId = await publicClient.getChainId();
  } catch {
    throw new Error(
      network === "local" ? `No local chain at ${rpcUrl}. Start one with \`npm run chain\`.` : `Cannot reach ${rpcUrl}`,
    );
  }
  if (chainId !== chain.id) throw new Error(`${rpcUrl} is chain ${chainId}, expected ${chain.id} (${network})`);

  let account: Account | Address;
  let extraAccounts: Address[] = [];
  if (network === "local") {
    const accounts = (await createWalletClient({ chain, transport }).getAddresses()).map((value) => getAddress(value));
    if (accounts.length < 3) throw new Error("The local node must expose at least 3 unlocked accounts");
    [account, ...extraAccounts] = accounts;
  } else {
    const key = process.env.DEPLOYER_PRIVATE_KEY;
    if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error("Set DEPLOYER_PRIVATE_KEY (0x-prefixed, 32 bytes) to deploy to a public network");
    }
    account = privateKeyToAccount(key as Hash);
  }

  const walletClient = createWalletClient({ account, chain, transport });
  return { network, chain, rpcUrl, publicClient, walletClient, extraAccounts };
}

/** Waits for a transaction and fails on revert, so every step of a script either lands or stops it. */
export async function confirm(signer: Signer, hash: Hash, label: string): Promise<void> {
  const receipt = await signer.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${label} reverted (${hash})`);
}
