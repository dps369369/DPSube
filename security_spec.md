# DPSube Security Specification (Payload-First Security TDD)

## 1. Data Invariants

1. **Private User Isolation**: Every document under `/users/{userId}` and its subcollections (`singleSolves`, `averageSessions`) belongs strictly to `userId == request.auth.uid`. No user may read, list, create, update, or delete another user's profile or solving records. No public directory or global listing is permitted in V1.
2. **Email Verification Gate**: All writes (`create`, `update`, `delete`) require `request.auth.token.email_verified == true`.
3. **User Profile Registration Integrity**: Creating `/users/{userId}` requires `uid == userId == request.auth.uid`, initial counters strictly `0`, initial best records strictly `null`, `createdAt == request.time`, and `updatedAt == request.time`.
4. **Immutable Historical Solves & Sessions**: Neither `singleSolves` nor `averageSessions` can be updated after creation (`allow update: if false`), preserving historical integrity.
5. **Single vs. Ao5 Relational Atomicity**:
   - A `SingleSolve` with `source == 'SINGLE'` must have `averageSessionId == null`.
   - A `SingleSolve` with `source == 'AO5'` must reference an `averageSessionId` whose document is created atomically in the same batch (`existsAfter`).
   - An `AverageSession` must reference strictly 5 valid `solveIds` and 5 valid `solveTimesMs`, and all 5 `SingleSolve` documents must be created atomically in the same batch (`existsAfter`).
   - Creating or deleting any `SingleSolve` or `AverageSession` must atomically update the parent `/users/{userId}` document (`getAfter(...).data.updatedAt == request.time`).
6. **Action-Based Profile Updates & Immortal Fields**: Updating `/users/{userId}` never changes `uid` or `createdAt`, always sets `updatedAt == request.time`, and may only perform either a profile edit (`username`, `photoUrl`, `updatedAt`) or a statistics sync (`bestSingleMs`, `bestSingleLevel`, `currentSingleLevel`, `bestAverageMs`, `bestAverageLevel`, `currentAverageLevel`, `totalSingleSolves`, `totalAverageSessions`, `updatedAt`).
7. **Strict Schema & Volumetric Bounds**: All IDs match `^[a-zA-Z0-9_\-]+$` with length `1..128`. Strings have strict `.size()` caps, solving times are integer milliseconds in `10..86400000`, levels are strictly in `L0..L9`, and shadow/ghost keys are rejected via `keys().hasAll(...) && keys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Malicious Payload / Request | Expected Result |
|---|---------------|-------------|---------------------------|-----------------|
| 1 | Cross-User Read/Write | `/users/victim_uid/singleSolves/s1` | Attacker (`attacker_uid`) reads or writes under `victim_uid` | `PERMISSION_DENIED` |
| 2 | Unverified Email Write | `/users/u1` | `email_verified: false` attempts `create` | `PERMISSION_DENIED` |
| 3 | Self-Inflated Initial Stats | `/users/u1` | `create` with `totalSingleSolves: 999, bestSingleMs: 5000` | `PERMISSION_DENIED` |
| 4 | Ghost / Shadow Field Injection | `/users/u1` | `create` or `update` including `{ "isAdmin": true }` | `PERMISSION_DENIED` |
| 5 | ID Poisoning (Oversized/Invalid ID) | `/users/u1/singleSolves/bad$id!` | `solveId` fails regex `^[a-zA-Z0-9_\-]+$` or > 128 chars | `PERMISSION_DENIED` |
| 6 | Client Timestamp Forgery | `/users/u1/singleSolves/s1` | `createdAt` set to past timestamp instead of `request.time` | `PERMISSION_DENIED` |
| 7 | Immortal Field Mutation | `/users/u1` | `update` modifying `uid` or `createdAt` | `PERMISSION_DENIED` |
| 8 | Historical Record Overwrite | `/users/u1/singleSolves/s1` | `update` modifying `timeMs` on existing solve | `PERMISSION_DENIED` |
| 9 | Orphaned Ao5 Solve (Missing Batch Session) | `/users/u1/singleSolves/s1` | `create` with `source: "AO5"`, `averageSessionId: "missing"` without batch session | `PERMISSION_DENIED` |
| 10 | Incomplete Ao5 Array (4 Solves Instead of 5) | `/users/u1/averageSessions/a1` | `solveIds` or `solveTimesMs` has length 4 instead of 5 | `PERMISSION_DENIED` |
| 11 | Unsynced Stats Write (Missing User Batch Update) | `/users/u1/singleSolves/s1` | `create` singleSolve without updating parent `/users/u1` `updatedAt` in batch | `PERMISSION_DENIED` |
| 12 | Blanket Collection Scrape / Negative Time Poisoning | `/users` or `/users/u1/singleSolves/s1` | `list` `/users`, or `create` with `timeMs: -100` or `level: "L99"` | `PERMISSION_DENIED` |
