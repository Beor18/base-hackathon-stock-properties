import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";
import { getAddress, isAddress, type Address } from "viem";
import { z } from "zod";

import { deployment } from "@/config/deployment";
import { serverEnv } from "@/config/server-env";

import { ServiceUnavailableError, UnauthorizedError } from "../errors";

/** Who is calling, from their Privy identity token: sign-in emails and account addresses. */
export type Identity = { emails: string[]; accounts: Address[] };

const LOCAL_CHAIN_ID = 31337;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Verifies the `privy-id-token` header (ES256, signed by Privy for this app) and reads the linked
 * accounts in it. On the local chain there is no Privy: dev accounts send `dev:<address>`.
 */
export async function requireIdentity(request: Request): Promise<Identity> {
  const token = request.headers.get("privy-id-token")?.trim();
  if (!token) throw new UnauthorizedError();

  if (token.startsWith("dev:")) {
    const address = token.slice(4);
    if (deployment.chainId !== LOCAL_CHAIN_ID || !isAddress(address)) throw new UnauthorizedError();
    return { emails: [], accounts: [getAddress(address)] };
  }

  const appId = serverEnv.PRIVY_APP_ID;
  if (!appId) throw new ServiceUnavailableError("auth_unconfigured", "Sign-in is not configured");
  jwks ??= createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`));

  let claims: Record<string, unknown>;
  try {
    ({ payload: claims } = await jwtVerify(token, jwks, { issuer: "privy.io", audience: appId }));
  } catch {
    throw new UnauthorizedError();
  }
  return readLinkedAccounts(claims.linked_accounts);
}

const linkedAccounts = z.array(z.object({ type: z.string(), address: z.string().nullish() }).loose()).catch([]);

/** `linked_accounts` is a JSON string with a light copy of the user's linked accounts. */
function readLinkedAccounts(raw: unknown): Identity {
  let value: unknown = [];
  try {
    value = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    value = [];
  }
  const accounts = linkedAccounts.parse(value);
  return {
    emails: accounts
      .filter((account) => account.type === "email" && account.address)
      .map((account) => account.address!.trim().toLowerCase()),
    accounts: accounts
      .filter((account) => (account.type === "smart_wallet" || account.type === "wallet") && account.address && isAddress(account.address))
      .map((account) => getAddress(account.address!)),
  };
}
