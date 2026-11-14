import type { NextRequest } from "next/server";
import { connection } from "next/server";

import { respond } from "@/server/http";
import { addressParam } from "@/server/schemas";
import { listReservationsOf } from "@/server/services/reservations";

/** GET /api/reservations?account=0x…: reservations where the account is the depositor or the beneficiary. */
export async function GET(request: NextRequest) {
  await connection();
  return respond(async () => {
    const account = addressParam.parse(request.nextUrl.searchParams.get("account") ?? "");
    return listReservationsOf(account);
  });
}
