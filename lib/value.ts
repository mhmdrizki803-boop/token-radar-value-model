// The token radar's VALUE MODEL — the one place a protocol's implied value is decided.
//
// Everything here is a pure function of the snapshot's own figures. No protocol name, slug, category or
// chain is ever special-cased: the same arithmetic scores all 758 records.
//
// THE FORMULA, term by term
// -------------------------
//   base       = tvl_usd x BASE_MULTIPLE
//   growthPct  = clamp(change_7d, GROWTH_FLOOR, GROWTH_CAP)
//   growthMult = 1 + (growthPct / 100) x GROWTH_WEIGHT
//   ageDays    = as_of - listed_at                       (null when listed_at is absent)
//   maturity   = MATURITY_FLOOR + min(ageDays, MATURITY_DAYS) / MATURITY_DAYS x MATURITY_RANGE
//   implied    = max(1, round(base x growthMult x maturity))
//
// Why each term exists:
//   BASE_MULTIPLE  — TVL is the only stock of value the index records for a pre-token protocol. A
//                    quarter of it is the model's conservative claim on what the market capitalisation
//                    of a token would be if the protocol monetised its deposits at the multiple a
//                    mature venue earns. Stated, not hidden.
//   GROWTH_WEIGHT  — seven-day change is demand right now. It moves the estimate by at most half of
//                    its own percentage, so a +120% week lifts the row 60% and a -60% week cuts it
//                    30%. It re-orders similar protocols; it cannot invent value out of noise.
//   GROWTH_FLOOR /
//   GROWTH_CAP     — the index carries real outliers (a 40x week on a small pool). Clamping keeps one
//                    quote from deciding the board.
//   MATURITY       — `listed_at` is the only record of how long a protocol has existed WITHOUT a
//                    token. Time with no token is the scarcest input a farmer supplies, so it is paid:
//                    a fresh listing scores 0.60 of its base, a protocol at or past MATURITY_DAYS
//                    scores the full 1.00. Unknown age falls back to UNKNOWN_AGE_DAYS.
//
// The constants live in MODEL so the dashboard can print the same numbers the board was computed with.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  base_multiple: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
}

export const MODEL: ModelConstants = {
  base_multiple: 0.25,
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
};

/** The model's version label: the dashboard names it and the dossier quotes it. */
export const MODEL_VERSION = 'radar-1';

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Round to four decimals, for the multipliers the dashboard prints. */
export function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

/**
 * Days a protocol has been on the index with no token: `as_of` minus `listed_at`.
 * Null when either date is missing or unparseable — the caller substitutes UNKNOWN_AGE_DAYS.
 */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** Every intermediate of the model, so a row can show its own working. */
export interface Score {
  implied: number;
  base: number;
  growthPct: number;
  growthMult: number;
  maturityMult: number;
  age: number | null;
}

/** The score one protocol gets under `model`. Pure: the same input always gives the same output. */
export function score(protocol: SnapshotProtocol, asOf: string, model: ModelConstants = MODEL): Score {
  const age = ageDays(asOf, protocol.listed_at);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, finite(protocol.change_7d, 0)));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult =
    model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const base = protocol.tvl_usd * model.base_multiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult));
  return { implied, base, growthPct, growthMult, maturityMult, age };
}

/**
 * Pre-token: the index records no token at all for this protocol. A row with a market cap, a CoinGecko
 * id or a symbol already trades, so it is priced by the market and is not this model's to value.
 */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** DefiLlama's version-marker rule: "Something V2" is a pool of another protocol, not its own launch. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Whether a protocol may enter the early radar: pre-token, not an exchange balance, not a version. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && p.category !== 'CEX' && !VERSIONED.test(p.name);
}

/** A protocol's first chain, for the plans and the table. */
export function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}