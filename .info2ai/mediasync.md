# mediasync — architecture document

## Overview

mediasync is a two-person, browser-only media synchronisation app. There is no backend, no database, and no server of your own. Ably acts as the sole infrastructure layer — a real-time message bus and presence system. The media file always stays on each person's device and is never transferred over the network.

---

## Core constraints

- Maximum 2 users at any time
- One global room — no room codes, no invites
- Both users must load their own local copy of the same file
- Either user can control playback and it syncs to the other instantly

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Browser (no install) |
| Real-time transport | Ably Realtime SDK |
| Media playback | Native HTML `<video>` / `<audio>` |
| File loading | `URL.createObjectURL()` — local only |
| State management | Plain JS booleans and event listeners |

---

## Channel

Both clients connect to a single hardcoded channel on app load:

```
mediasync:global
```

No room code is generated or exchanged. Opening the app is the entire join flow.

---

## Presence

Ably presence is used for three things:

1. **Partner detection** — knowing when the other person connects or disconnects
2. **2-user cap enforcement** — blocking a third client from entering
3. **State handshake trigger** — when a new presence `enter` event arrives, the existing client immediately broadcasts their current state

### 2-user cap

Before calling `presence.enter()`, every client first calls `presence.get()`. If 2 members are already in the channel, the client shows an "already in use" error and does not enter.

```
presence.get() → members
├── members.length >= 2 → show error, abort
└── members.length < 2  → presence.enter(), proceed
```

> **Note:** There is a theoretical race condition where two clients call `presence.get()` simultaneously, both see 0 members, and both enter. For a personal two-person app this is acceptable. If it needs hardening, a server-side Ably rule or token-based auth can enforce the cap.

---

## Readiness model

Unlike play/pause/seek, `load` is a **readiness handshake**, not just a sync event. Playback controls are disabled until both sides are ready.

Each client tracks two independent booleans:

```
selfReady  — I have loaded a file and loadedmetadata has fired
peerReady  — partner has published a load event
```

Controls are enabled only when `selfReady && peerReady`.

---

## Event catalogue

All events are published to `mediasync:global`. Every payload includes `from: clientId` so each client can ignore its own echoed messages.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `load` | both → both | `{ fileName, size, duration }` | User picked a file and it is ready to play |
| `play` | both → both | `{ time }` | User pressed play |
| `pause` | both → both | `{ time }` | User pressed pause |
| `seek` | both → both | `{ time, paused }` | User seeked to a new position |
| `state` | both → both | `{ time, paused, selfReady }` | Full state snapshot, sent on partner presence enter |
| `state-request` | both → both | `{}` | Request a state snapshot, sent on Ably reconnect |

---

## Load flow

This is the most critical flow in the app. The sequence runs identically and symmetrically on both clients.

```
User picks file
  ↓
Set src on mediaEl
  ↓
Wait for loadedmetadata
  ↓ (fires)
selfReady = true
Publish load { fileName, size, duration }
  ↓
if peerReady → enable controls → trigger state sync
```

When a `load` event arrives from the partner:

```
Receive partner load { fileName, size, duration }
  ↓
Compare fileName + size against own file (if loaded)
├── mismatch → show warning toast (files may be different)
└── match    → silent confirmation
  ↓
peerReady = true
  ↓
if selfReady → enable controls → trigger state sync
```

### Load timing edge cases

**Partner loads before you connect.**
Their `load` event was published before you joined the channel. You won't receive it. The state handshake (triggered by your presence `enter`) includes their `selfReady` flag. When you pick your file, you set `peerReady = true` based on that handshake data rather than a live `load` event.

**You load, partner hasn't connected yet.**
Your `load` publish goes to nobody. When partner eventually joins, your `state` response to their presence `enter` includes `selfReady: true`. They use that to set their `peerReady = true` once they have loaded their own file.

**Incoming sync events arrive before you have loaded a file.**
`mediaEl` is null or not ready. Queue the most recent incoming event per type and replay it once `selfReady` becomes true. Only the latest event matters — discard older ones of the same type.

**`loadedmetadata` never fires.**
The file format is unsupported. Listen for the `error` event on the media element and surface a clear message. Do not set `selfReady = true`.

---

## Sync flow

### Echo prevention

When a remote `play` event arrives and you call `mediaEl.play()`, the browser fires your own `play` listener, which would re-publish to Ably and create an infinite loop. Prevent this with a flag:

```
isSyncing = true
  → apply remote change to mediaEl
  → setTimeout(() => isSyncing = false, 500)

In every local event listener:
  if (isSyncing) return  // do not publish
```

The 500ms window is intentionally generous to absorb async browser event timing.

### Drift correction

Playback can drift slightly due to buffering or CPU load even when sync events are perfectly delivered. Every 8 seconds, compare local `currentTime` against the last known partner `currentTime` (updated on every received event). If the delta exceeds **1.5 seconds**, snap the local player silently:

```
every 8s:
  delta = |mediaEl.currentTime - partnerLastKnownTime|
  if delta > 1.5 → mediaEl.currentTime = partnerLastKnownTime
```

Do not publish a seek event when correcting drift — this is a local-only adjustment.

### Seek while media is not loaded

If a remote `seek` arrives before your media is ready, applying it does nothing silently and the position is lost. Store the last incoming `seek` payload as `pendingSeek`. On `loadedmetadata`, apply it before enabling controls.

---

## State handshake

This is how a late-joining user catches up, and how a reconnecting user re-syncs.

**Trigger 1 — partner presence enter:**
When your presence subscription receives an `enter` event for the other client, you immediately publish:

```js
publish('state', {
  time: mediaEl?.currentTime ?? 0,
  paused: mediaEl?.paused ?? true,
  selfReady: selfReady
})
```

**Trigger 2 — Ably reconnect:**
When `ably.connection` transitions to `connected` after a prior disconnect, publish a `state-request`. The partner responds with their current `state` payload.

---

## Connection states

```
disconnected   → app just opened, Ably not yet connected
connecting     → Ably SDK initialising
waiting        → connected to channel, no partner present
ready          → both clients present, both files loaded
solo           → partner disconnected mid-session (play continues locally)
room-full      → presence.get() returned 2 members, cannot enter
error          → Ably connection failed (bad API key, network down)
```

Transitions:

```
disconnected → connecting (on app load)
connecting   → waiting   (on Ably connected + presence entered)
waiting      → ready     (on partner presence enter + both selfReady)
ready        → solo      (on partner presence leave)
solo         → ready     (on partner presence enter again)
any          → error     (on Ably connection failed)
```

---

## File verification

Since files are never transferred, both users must load the same file themselves. The app cannot guarantee they did. On receiving the partner's `load` event, compare:

- `fileName` — catches most human errors (wrong episode, wrong file)
- `size` — catches same-named files that are different encodes

This is not cryptographic proof. For a personal app it is sufficient. A stronger check would be to hash the first 64 KB of the file on the client and compare hashes — fast enough to not block UX, strong enough to catch virtually all mismatches.

---

## What is not needed

- No backend server
- No database
- No authentication or user accounts
- No WebRTC (only needed if transferring the file itself)
- No service worker or offline support
- No room code generation or exchange

---

## Sequence diagram — happy path

```
User A                    Ably                     User B
  |                         |                         |
  |── presence.enter() ────>|                         |
  |                         |                         |
  |                         |<──── presence.enter() ──|
  |<── presence enter evt ──|                         |
  |                         |──── presence enter evt─>|
  |                         |                         |
  |── state { t=0 } ───────>|──────────────────────── >|
  |                         |<──── state { t=0 } ─────|
  |                         |                         |
  [A picks file]            |                [B picks file]
  |── load { fileName } ───>|─────────────────────── >|
  |                         |<──── load { fileName } ─|
  |                         |                         |
  [both selfReady && peerReady — controls enabled]
  |                         |                         |
  [A presses play]          |                         |
  |── play { time: 0 } ────>|──────────────────────── >|
  |                         |              [B.play()]  |
  |                         |                         |
  [A seeks to 01:32]        |                         |
  |── seek { time: 92 } ───>|──────────────────────── >|
  |                         |         [B.currentTime = 92]
```
