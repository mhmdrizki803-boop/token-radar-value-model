// FARM PLANS — one concrete plan per protocol, built from that protocol's own record.
//
// A plan is four things a farmer actually decides: which position to open, how much capital it needs,
// how long to hold it, and what every step costs. Every input comes from the snapshot row (category,
// chains, tvl_usd, listed_at) — never from a list of names. Two protocols of the same category, chain
// and size therefore get the same plan; two of different size do not.
//
// The rules below are deliberately boring and stated, because a farm plan that cannot be checked is
// just a slogan:
//   capital  — the size of the position, from the protocol's own TVL band (bigger venue, bigger ask).
//   hold     — how long the position stays open, from how long the protocol has existed without a
//              token: a young protocol has further to run, so it is held longer.
//   action   — the one sentence that matches the protocol's category, in the words of its own chain.

import { chainOf, type SnapshotProtocol } from './value.ts';

/** A farm step before it is flattened into the single string board.json carries. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/**
 * How much capital one qualifying position needs, from the protocol's TVL band.
 * A $4B venue is not impressed by $50, and a $2M venue does not need $250.
 */
export function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long the position is held, from the protocol's age: younger protocols get a longer window. */
export function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The opening action, in the words a farmer can follow, for the protocol's own category and chain. */
export function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) {
    return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  }
  if (c.includes('leveraged farm') || c.includes('farm') || c.includes('yield') || c.includes('dex')) {
    return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  }
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) {
    return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  }
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('option')) {
    return `Deposit $${capital} of USDC as margin on ${name} and open one small position you can hold.`;
  }
  if (c.includes('prediction')) return `Fund ${name} with $${capital} and take one position on a market you can follow.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('manager')) {
    return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  }
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa') || c.includes('treasury')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  if (c.includes('nft')) return `List or buy one item on ${name} for about $${capital} and keep the receipt.`;
  if (c.includes('launchpad')) return `Buy $${capital} of the allocation ${name} offers and hold it past the first unlock.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/**
 * The six-step plan for one protocol: fresh wallet, the position, the weekly rhythm, the hold, the
 * claim, the log. Each step carries its cost and its duration, so the plan can be checked, not admired.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const gas = capital >= 150 ? 8 : 4;
  return [
    {
      text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.',
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and about $${gas} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.',
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity lands in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: "Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.",
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.',
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** A step as one string: its action, then its cost and time, inside the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The plan for one protocol as the strings board.json carries. */
export function planFor(p: SnapshotProtocol, age: number | null): string[] {
  return farmSteps(p, age).map(stepText);
}