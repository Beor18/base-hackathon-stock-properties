import type { NextRequest } from "next/server";
import { connection } from "next/server";

import { requireIdentity } from "@/server/auth/identity";
import { readJson, respond } from "@/server/http";
import { addressParam } from "@/server/schemas";
import { getInboxSeen, inboxSeenSchema, markInboxSeen } from "@/server/services/offers";

/** GET /api/inbox?account=0x…: when the broker last opened their inbox. */
export async function GET(request: NextRequest) {
  await connection();
  return respond(async () => getInboxSeen(addressParam.parse(request.nextUrl.searchParams.get("account") ?? "")));
}

/** POST /api/inbox { account }: marks the inbox as read now. Needs the `privy-id-token` header. */
export async function POST(request: Request) {
  return respond(async () => {
    const identity = await requireIdentity(request);
    return markInboxSeen(identity, inboxSeenSchema.parse(await readJson(request)).account);
  });
}
