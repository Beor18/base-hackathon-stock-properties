import type { NextRequest } from "next/server";

import { respond } from "@/server/http";
import { addressParam } from "@/server/schemas";
import { listGuaranteesOf } from "@/server/services/guarantees";

/** GET /api/guarantees?account=0x…: guarantees where the account is tenant or landlord. */
export async function GET(request: NextRequest) {
  return respond(async () => {
    const account = addressParam.parse(request.nextUrl.searchParams.get("account") ?? "");
    return listGuaranteesOf(account);
  });
}
