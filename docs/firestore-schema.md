# Firestore schema — AgriSim Global

Status: design for Phase 2.1. This document follows the business specification's reference schema. Fields marked `[S]` are source rules; `[D]` are implementation details that may be refined without changing business rules.

## Ownership and access

- Every player-owned path is scoped by the Firebase Auth UID obtained only from a verified ID token `[S]`.
- The browser never reads or writes Firestore directly; `firestore.rules` denies all client access and Express uses Firebase Admin SDK `[S]`.
- The current game is the single document at `games/{uid}`. Its subcollections therefore cannot be addressed with another user's UID `[S]`.
- All mutations that change assets must run in a Firestore transaction, write history, and record an idempotency command in the same transaction `[S]`.

## Collections

### `users/{uid}`

Created idempotently on the first authenticated profile request. No password, hash, token, or other credential is stored.

| Field | Type | Default / rule |
| --- | --- | --- |
| `displayName` | string \| null | Firebase Auth display name |
| `email` | string \| null | Firebase Auth email |
| `createdAt` | Firestore Timestamp | Set once on provisioning |
| `updatedAt` | Firestore Timestamp | Set on profile changes |
| `isDemo` | boolean, optional `[D]` | Omit for normal users; demo isolation policy remains undecided `[C]` |

### `games/{uid}`

Created only by the start/restart command; no game document exists before the player chooses a start region.

| Field | Type | Default / rule |
| --- | --- | --- |
| `uid` | string | Must equal document ID `[S]` |
| `generationId` | string `[D]` | New identifier for each new game |
| `status` | `ACTIVE` \| `FINISHED` | `ACTIVE` at start `[S]` |
| `currentRound` | integer | `1`, constrained to 1–6 `[S]` |
| `startRegion` | `CHAU_A` \| `CHAU_AU` | Required at start `[S]` |
| `walletUsdG` | number | `2000` at start; never negative `[S]` |
| `totalTopups` | number | `0` at start; accumulated separately from profit `[S]` |
| `startedAt` | Timestamp | Required |
| `finishedAt` | Timestamp \| null | Set only at finish |
| `version` | integer | `1` at start; increment on mutation `[D]` |
| `summarySnapshot` | map \| null | Set only at finish `[S]` |

### `games/{uid}/plots/{plotId}`

| Field | Type | Default / rule |
| --- | --- | --- |
| `status` | `EMPTY` \| `GROWING` \| `READY` | One `EMPTY` plot at start `[S]` |
| `plantedRound` | integer \| null | Set when planted |
| `readyRound` | integer \| null | Plant round + 1 `[S]` |

### `games/{uid}/lots/{lotId}`

| Field | Type | Rule |
| --- | --- | --- |
| `asset` | `RICE` \| `GOLD` | Required |
| `quantity` | number | Non-negative `[S]` |
| `qualityPercent` | number | 0–100; RICE loses 5 percentage points each round, GOLD stays 100 `[S]` |
| `region` | `CHAU_A` \| `CHAU_AU` | Required |
| `status` | `AVAILABLE` \| `SPOILED` | `SPOILED` at 0% quality `[S]` |
| `source` | `HARVEST` \| `SWAP` \| `SHIPMENT` | Required |
| `createdRound` | integer | 1–6 |

### `games/{uid}/pools/{poolId}`

`poolId` is `RICE` or `GOLD`. Each player's pools are private to that game.

| Field | Type | Rule |
| --- | --- | --- |
| `asset` | `RICE` \| `GOLD` | Matches pool ID |
| `assetReserve` | number | Initial: RICE 1000, GOLD 100; never negative `[S]` |
| `usdgReserve` | number | Initial 10000; never negative `[S]` |
| `feeRate` | number | `0.003` `[S]` |
| `version` | integer | Increment after swap `[D]` |

### `games/{uid}/shipments/{shipmentId}`

| Field | Type | Rule |
| --- | --- | --- |
| `asset`, `quantity`, `qualityPercent` | same as lot | Quantity non-negative |
| `origin`, `destination` | region enum | Must differ `[S]` |
| `sentRound`, `arrivalRound` | integer | Arrival = sent + 1; sending allowed only rounds 1–5 `[S]` |
| `shippingFeeUsd` | number | Quantity × 0.5 × round multiplier `[S]` |
| `status` | `IN_TRANSIT` \| `ARRIVED` | Required |
| `arrivedLotId` | string \| null | Set once on arrival `[S]` |

### `games/{uid}/history/{eventId}`

Append-only records for successful actions and system arrivals. Required event types include `GAME_STARTED`, `PLANTED`, `HARVESTED`, `PLOT_PURCHASED`, `TOPPED_UP`, `SWAPPED`, `SOLD`, `SHIPPED`, `SHIPMENT_ARRIVED`, `ROUND_ADVANCED`, and `GAME_FINISHED` `[S]`.

Common fields: `type`, `round`, `createdAt`, `requestId?`, `entityIds?`, `asset?`, `quantity?`, `usdDelta?`, `feeAmount?`, `feeAsset?`, `feeUsdEquivalent?`, and `details?`.

### `games/{uid}/commands/{requestId}`

Idempotency journal `[D]`. Every write command uses one client-generated `requestId`.

| Field | Type | Rule |
| --- | --- | --- |
| `type` | string | Command name |
| `requestHash` | string | Hash of command payload; never password-related |
| `status` | `COMPLETED` | Written only with a completed transaction |
| `resultSummary` | map | Stored response required for a safe retry |
| `createdAt` | Timestamp | Required |

## Confirmed calculation policy

- Values for USDG, pool reserves, quantities, fees, and AMM calculations retain up to 8 decimal places internally.
- Intermediate calculation steps are not rounded; only the user interface formats USDG to 2 decimal places.

## Known decisions still required before financial implementation

- Replay archive/delete policy and bounded strategy for subcollection replacement `[C]`.
- Demo-account isolation policy `[C]`.
- Scenario version pinning when SQLite seed changes during an active game `[C]`.

These decisions are not needed for the profile API; they must be confirmed before implementing financial commands, AMM swaps, and restart semantics.
