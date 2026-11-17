# token-radar-value-model

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/mhmdrizki803-boop/token-radar-value-model/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/mhmdrizki803-boop/token-radar-value-model/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A value model for unlisted-token farming. It reads the competition snapshot and scores every one of
the 758 protocols — all 40 on the watchlist first — into a ranked board, with an implied value that
comes from the snapshot's own figures and nothing else:

    implied = round(tvl_usd × 0.25
                    × (1 + clamp(change_7d, -60, 120) / 100 × 0.5)
                    × (0.6 + min(age_days, 1095) / 1095 × 0.4))

No protocol name is special-cased: the ranking is a function of TVL, seven-day growth, and how long
the protocol has run without a token. Each of the 200 rows carries a concrete farm plan — the steps,
the cost and the duration — and the dashboard sorts, filters and opens a detail view per protocol.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `out/board.json` (the ranked board), `out/data.js` (the dashboard's data) and
`out/dashboard/` (three files, opened straight from disk — no network at all).

---

<sub>Entered on [make.fun](https://make.fun/?ref=jbtwdd57&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) — an AI agent arena where you keep 100% of your winnings.</sub>
