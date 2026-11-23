import type { Address } from "viem";

import { ButtonLink } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { deployment } from "@/config/deployment";
import type { Locale } from "@/i18n/config";
import type { ContractKey, DevelopersCopy } from "@/i18n/developers/es";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatBps, shortAddress } from "@/i18n/format";

/** Where the app is served, for the code sample other apps copy. */
const APP_URL = "https://accasa.vercel.app";
const REPO_URL = "https://github.com/Beor18/base-hackathon-stock-properties";

/** Blockscout shows verified source for free on both Base networks; the deployment's explorer may not. */
const SOURCE_EXPLORER: Partial<Record<number, string>> = {
  84532: "https://base-sepolia.blockscout.com",
  8453: "https://base.blockscout.com",
};

/** Contracts whose source is verified on Blockscout for this deployment (checked on 23 Nov 2026). */
const VERIFIED: ContractKey[] = ["reservationEscrow", "stockOracle", "goalRegistry"];

/** Every figure the copy quotes, from the deployment the contracts were created with. */
function values(lang: Locale): Record<string, string | number> {
  const p = deployment.params;
  const ratios = deployment.stocks.map((stock) => stock.collateralRatioBps);
  const days = (seconds: number) => Math.round(seconds / 86_400);
  return {
    chainId: deployment.chainId,
    minMargin: formatBps(Math.min(...ratios) - 10_000, lang),
    maxMargin: formatBps(Math.max(...ratios) - 10_000, lang),
    fee: formatBps(p.reservationFeeBps, lang),
    claimDays: days(p.claimWindowSeconds),
    disputeDays: days(p.disputeWindowSeconds),
    arbitrationDays: days(p.arbitrationTimeoutSeconds),
    settlementHours: Math.round(p.settlementMaxAgeSeconds / 3_600),
    slippage: formatBps(p.maxSlippageBps, lang),
    builderCode: deployment.builderCode ?? "",
  };
}

function codeSample(escrow: Address): string {
  return `import { erc20Abi, keccak256, parseUnits, toHex, zeroAddress } from "viem";

const ESCROW = "${escrow}"; // ReservationEscrow on Base Sepolia
// ABI: verified on the explorer, or src/contracts/abis.ts in the repo.

// 1. How much of the stock to lock for a USD 5,000 deposit (margin and fee included)
const [quote] = await fetch(
  \`${APP_URL}/api/quote?coverageUsd=5000&token=\${token}\`,
).then((response) => response.json());

// 2. Approve the stock, then lock it as the deposit
await wallet.writeContract({
  address: token,
  abi: erc20Abi,
  functionName: "approve",
  args: [ESCROW, BigInt(quote.totalTokens)],
});
await wallet.writeContract({
  address: ESCROW,
  abi: reservationEscrowAbi,
  functionName: "createReservation",
  args: [{
    beneficiary: broker,        // who can claim the deposit
    arbiter: zeroAddress,       // zero picks the protocol's default arbiter
    token,
    collateral: BigInt(quote.collateral),
    coverageUsd: parseUnits("5000", 18),
    endsAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 86_400),
    propertyRef: keccak256(toHex("your-listing-id")),
  }],
});`;
}

/**
 * `/developers`: Accasa's reservation contracts documented for other apps. Addresses, parameters
 * and the code sample all come from the deployment, so the page follows any redeploy.
 */
export function DevelopersView({ lang, copy, common }: { lang: Locale; copy: DevelopersCopy; common: Dictionary["common"] }) {
  const v = values(lang);
  const text = (template: string) => fill(template, v);
  const sourceBase = SOURCE_EXPLORER[deployment.chainId];
  const explorer = deployment.explorerUrl;

  const rows: { key: string; name: string; role: string; address: Address; verified: boolean }[] = [
    ...copy.contracts.items.map((item) => ({
      key: item.key,
      name: item.name,
      role: item.role,
      address: deployment.contracts[item.key] as Address,
      verified: VERIFIED.includes(item.key),
    })),
    ...deployment.routers.map((router) => ({
      key: router,
      name: copy.contracts.router.name,
      role: copy.contracts.router.role,
      address: router as Address,
      verified: false,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pt-8 md:px-8 md:pt-14">
      <header className="max-w-3xl">
        <p className="text-label font-semibold text-accent">{copy.label}</p>
        <h1 className="type-display mt-3 text-[2.375rem] leading-[1.05] text-balance text-ink sm:text-display">{copy.heading}</h1>
        <p className="mt-5 text-lead text-ink-2 text-pretty">{copy.lead}</p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline"
        >
          {copy.repo}
        </a>
      </header>

      <section aria-labelledby="dev-contratos" className="mt-14">
        <h2 id="dev-contratos" className="type-heading text-h2 text-ink">
          {copy.contracts.title}
        </h2>
        <p className="mt-2 text-ink-2">{text(copy.contracts.network)}</p>
        <ul className="mt-5 divide-y divide-line rounded-[var(--radius-sheet)] border border-line bg-surface">
          {rows.map((row) => {
            const href = row.verified && sourceBase ? `${sourceBase}/address/${row.address}?tab=contract` : explorer ? `${explorer}/address/${row.address}` : null;
            return (
              <li key={row.key} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-6">
                <div className="min-w-0">
                  <p className="font-mono text-[0.9375rem] font-semibold text-ink">{row.name}</p>
                  <p className="mt-1 text-label text-ink-2 text-pretty">{row.role}</p>
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center text-label font-semibold text-accent underline-offset-4 hover:underline"
                    >
                      {row.verified ? copy.contracts.source : copy.contracts.unverified}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <code className="font-mono text-label text-ink tabular" title={row.address}>
                    {shortAddress(row.address)}
                  </code>
                  <CopyButton value={row.address} label={common.copy} copiedLabel={common.copied} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="dev-ciclo" className="mt-14">
        <h2 id="dev-ciclo" className="type-heading text-h2 text-ink">
          {copy.lifecycle.title}
        </h2>
        <ol className="mt-5 grid gap-5">
          {copy.lifecycle.steps.map((step, index) => (
            <li key={step.fn} className="grid grid-cols-[2rem_1fr] gap-3">
              <span aria-hidden className="type-heading flex size-8 items-center justify-center rounded-full bg-mango-soft text-mango-ink tabular">
                {index + 1}
              </span>
              <div>
                <p className="font-mono text-[0.9375rem] font-semibold text-ink">{step.fn}</p>
                <p className="mt-1 text-ink-2 text-pretty">{text(step.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="dev-codigo" className="mt-14">
        <h2 id="dev-codigo" className="type-heading text-h2 text-ink">
          {copy.code.title}
        </h2>
        <p className="mt-2 text-ink-2 text-pretty">{copy.code.body}</p>
        <pre className="mt-5 overflow-x-auto rounded-[var(--radius-sheet)] bg-[#15232b] p-5 text-[0.8125rem] leading-relaxed text-[#f3f4ef]">
          <code className="font-mono">{codeSample(deployment.contracts.reservationEscrow as Address)}</code>
        </pre>
        <p className="mt-4 text-label text-ink-2 text-pretty">{copy.code.note}</p>
      </section>

      <section aria-labelledby="dev-api" className="mt-14">
        <h2 id="dev-api" className="type-heading text-h2 text-ink">
          {copy.api.title}
        </h2>
        <p className="mt-2 text-ink-2">{copy.api.body}</p>
        <dl className="mt-5 divide-y divide-line border-y border-line">
          {copy.api.items.map((item) => (
            <div key={item.path} className="grid gap-1 py-4 md:grid-cols-[18rem_1fr] md:gap-6">
              <dt className="font-mono text-label font-semibold break-all text-ink">{item.path}</dt>
              <dd className="text-ink-2 text-pretty">{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="dev-saber" className="mt-14">
        <h2 id="dev-saber" className="type-heading text-h2 text-ink">
          {copy.disclosures.title}
        </h2>
        <ul className="mt-5 grid gap-3">
          {copy.disclosures.items.map((item) => (
            <li key={item} className="flex gap-3 text-ink-2">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-3" />
              <span className="text-pretty">{text(item)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <ButtonLink href={`/${lang}/casa`} className="w-full sm:w-auto sm:min-w-64">
          {copy.cta}
        </ButtonLink>
      </div>
    </div>
  );
}
