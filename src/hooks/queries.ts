"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

import { getProperty } from "@/components/property/api";
import { api } from "@/lib/api";

/** Query keys, so transactions can invalidate exactly what they change. */
export const keys = {
  account: (address?: Address) => ["account", address] as const,
  reservation: (id: string) => ["reservation", id] as const,
  reservations: (address?: Address) => ["reservations", address] as const,
  stocks: ["stocks"] as const,
  stats: ["stats"] as const,
  rates: ["rates"] as const,
  property: (ref: string | null, url: string | null) => ["property", ref, url] as const,
};

export function useStocks() {
  return useQuery({ queryKey: keys.stocks, queryFn: api.stocks, staleTime: 30_000 });
}

export function useAccountSnapshot(address: Address | undefined) {
  return useQuery({
    queryKey: keys.account(address),
    queryFn: () => api.account(address as Address),
    enabled: Boolean(address),
  });
}

export function useRates() {
  return useQuery({ queryKey: keys.rates, queryFn: api.rates, staleTime: 5 * 60_000 });
}

export function useStats() {
  return useQuery({ queryKey: keys.stats, queryFn: api.stats, staleTime: 30_000 });
}

export function useProperty(ref: string | null, url: string | null) {
  return useQuery({
    queryKey: keys.property(ref, url),
    queryFn: ({ signal }) => getProperty(ref as string, url, signal),
    enabled: Boolean(ref),
    staleTime: 5 * 60_000,
  });
}

export function useReservation(id: string | null) {
  return useQuery({
    queryKey: keys.reservation(id ?? ""),
    queryFn: () => api.reservation(id as string),
    enabled: Boolean(id),
    retry: (count, error) => !(error instanceof Error && "status" in error && error.status === 404) && count < 1,
  });
}
