import "server-only";

import { getAddress } from "viem";
import { z } from "zod";

import type { InboxSeen, ReservationOfferDto } from "@/domain/types";
import { DEPOSIT_PCT } from "@/lib/product";
import type { Identity } from "@/server/auth/identity";
import { getListingAgentEmail } from "@/server/clients/smarlin";
import { findOffer, insertOffer, readInboxSeen, writeInboxSeen, type OfferRow } from "@/server/clients/store";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { addressParam, propertyRefParam } from "@/server/schemas";

import { loadProperty } from "./goal-property";

const OFFER_ID = /^[A-Za-z0-9]{10}$/;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const offerIdParam = z.string().regex(OFFER_ID, "Expected an offer id");

export const createOfferSchema = z.object({
  ref: propertyRefParam,
  url: z.url().max(600).nullable().default(null),
  pct: z.number().min(DEPOSIT_PCT.min).max(DEPOSIT_PCT.max),
  broker: addressParam,
  brokerName: z.string().trim().min(1).max(80),
  brokerCompany: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .default(null)
    .transform((value) => value || null),
});

export const inboxSeenSchema = z.object({ account: addressParam });

/** 10 random base62 characters: short enough for WhatsApp, impossible to guess. */
function newOfferId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

function toDto(row: OfferRow): ReservationOfferDto {
  return {
    id: row.id,
    ref: row.property_ref,
    sourceUrl: row.source_url,
    pct: row.deposit_pct,
    broker: getAddress(row.broker_address),
    brokerName: row.broker_name,
    brokerCompany: row.broker_company,
    verified: row.broker_verified,
  };
}

/** True when one of the broker's sign-in emails is the listing agent's on Smarlin. */
async function isListingAgent(ref: string, emails: string[]): Promise<boolean> {
  if (!ref.toLowerCase().startsWith("smarlin:") || emails.length === 0) return false;
  try {
    const agentEmail = await getListingAgentEmail(ref.slice("smarlin:".length));
    return agentEmail !== null && emails.includes(agentEmail);
  } catch (error) {
    console.warn("[offers] could not check the listing agent", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Stores the broker's offer and returns it with its id. The beneficiary is always one of the
 * signed-in person's own accounts, so nobody can make a link that pays someone else.
 */
export async function createOffer(identity: Identity, input: z.infer<typeof createOfferSchema>): Promise<ReservationOfferDto> {
  if (!identity.accounts.includes(input.broker)) {
    throw new ForbiddenError("not_your_account", "The link must pay the signed-in account");
  }
  // The buyer's quote needs the property: fail now rather than on their screen.
  await loadProperty(input.ref, input.url);

  const row: OfferRow = {
    id: newOfferId(),
    property_ref: input.ref,
    source_url: input.url,
    deposit_pct: input.pct,
    broker_address: input.broker,
    broker_name: input.brokerName,
    broker_company: input.brokerCompany,
    broker_verified: await isListingAgent(input.ref, identity.emails),
  };
  await insertOffer(row);
  return toDto(row);
}

export async function getOffer(id: string): Promise<ReservationOfferDto> {
  const row = await findOffer(id);
  if (!row) throw new NotFoundError("Offer not found");
  return toDto(row);
}

export async function getInboxSeen(account: string): Promise<InboxSeen> {
  const seen = await readInboxSeen(account.toLowerCase());
  return { seenAt: seen ? Math.floor(seen.getTime() / 1000) : null };
}

/** Marks the broker's inbox as read now. Only for the signed-in person's own account. */
export async function markInboxSeen(identity: Identity, account: z.infer<typeof addressParam>): Promise<InboxSeen> {
  if (!identity.accounts.includes(account)) throw new ForbiddenError("not_your_account", "Not the signed-in account");
  const now = new Date();
  await writeInboxSeen(account.toLowerCase(), now);
  return { seenAt: Math.floor(now.getTime() / 1000) };
}
