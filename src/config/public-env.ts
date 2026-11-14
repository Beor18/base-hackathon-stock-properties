import { isAddress, type Address } from "viem";
import { z } from "zod";

import { isSupportedChainId, type SupportedChainId } from "./chains";

/**
 * Browser-safe configuration. Next.js inlines `NEXT_PUBLIC_*` values at build time, so each
 * variable must be referenced by its full name below.
 */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());

const schema = z.object({
  chainId: z.coerce
    .number({ error: "NEXT_PUBLIC_CHAIN_ID is required" })
    .refine(isSupportedChainId, "NEXT_PUBLIC_CHAIN_ID must be 8453 (Base), 84532 (Base Sepolia) or 31337 (local)"),
  escrowAddress: z
    .string({ error: "NEXT_PUBLIC_ESCROW_ADDRESS is required" })
    .refine((value) => isAddress(value), "NEXT_PUBLIC_ESCROW_ADDRESS must be a contract address"),
  rpcUrl: optionalUrl,
  builderCode: z.preprocess(emptyToUndefined, z.string().optional()),
  paymasterUrl: optionalUrl,
});

const parsed = schema.safeParse({
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
  escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  builderCode: process.env.NEXT_PUBLIC_BUILDER_CODE,
  paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.message}`).join("\n");
  throw new Error(
    `Garante is not configured:\n${issues}\nRun \`npm run chain\` for a local setup or copy .env.example to .env.local.`,
  );
}

export const publicEnv = {
  ...parsed.data,
  chainId: parsed.data.chainId as SupportedChainId,
  escrowAddress: parsed.data.escrowAddress as Address,
};
