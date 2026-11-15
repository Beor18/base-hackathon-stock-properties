import type { Address, Hash } from "viem";

import type { PlannedCall } from "@/domain/types";
import type { SignInProps } from "@/components/account/types";

/**
 * The person's account, whatever is behind it. Screens only ever see this:
 * - Privy: an email login with a sponsored smart account that sends a whole batch at once.
 * - Dev (chain 31337 only): Anvil's unlocked accounts, picked from a selector, sending one by one.
 */
export interface AccountWallet {
  kind: "privy" | "dev";
  address: Address;
  /**
   * Sends the planner's calls. Privy sends them as one atomic batch; dev sends them in order and
   * waits for each. Resolves with the hash of the (last) transaction once it was submitted.
   */
  sendCalls(calls: PlannedCall[]): Promise<Hash>;
}

export type AccountSession =
  | { status: "loading" }
  /** Public network without `NEXT_PUBLIC_PRIVY_APP_ID`: accounts cannot work, the app says so. */
  | { status: "unconfigured" }
  | { status: "signed-out"; signIn: SignInProps }
  /** Signed in, but the account never became usable (e.g. the sign-in provider's wallet frame did not load). */
  | { status: "failed" }
  | {
      status: "ready";
      address: Address;
      wallet: AccountWallet;
      /** The email the person signed in with. Null for local dev accounts. */
      email: string | null;
      signOut: () => Promise<void>;
    };
