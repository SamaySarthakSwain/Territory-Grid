# Territory Grid // Game Master Event Setup & Operational Manual

This manual provides complete step-by-step instructions for organizing, provisioning, and executing a live **Territory Grid** scavenger hunt competition.

---

## 1. Physical Hardware & Site Preparation

### 1.1 Field Checkpoints & Equipment Checklist
For a standard 10-checkpoint event (e.g. 4 to 8 squads of competitors):

| Item | Quantity per Station | Total Required (10 Stations) | Description |
| :--- | :--- | :--- | :--- |
| **Tactical Cones** | 3 cones (1 Red, 1 Yellow, 1 Green) | 30 cones total | Heavy-duty sports agility cones placed at each designated sector. |
| **Playing Card Decks** | 1 standard 52-card deck | 10 sealed decks | Field Marshals shuffle and present face-down cards to arriving squads. |
| **Field Marshal Smartphone** | 1 Android device (minSdk 26+) | 10 devices | Running Territory Grid with active Wi-Fi or cellular data. |
| **Zone Beacon Label** | 1 weatherproof placard | 10 placards | Displays Sector Callout (e.g., `ZONE_01 // ARCHWAY`). |

### 1.2 Point Value Reference Card (Laminated for Field Marshals)
```
=============================================================
           TERRITORY GRID // SCORING MATRIX
=============================================================
  CONE COLOR VALUES:
    [RED]    = +10 PTS
    [YELLOW] = +12 PTS
    [GREEN]  = +15 PTS

  CARD RANK VALUES:
    Ace=1, 2=2, 3=3, 4=4, 5=5, 6=6, 7=7, 8=8, 9=9, 10=10,
    Jack=11, Queen=12, King=13

  FORMULA:
    TOTAL POINTS = CONE VALUE + CARD RANK
    (Example: GREEN (15) + 8 of Spades (8) = 23 PTS)
=============================================================
```

---

## 2. Pre-Event Grid Provisioning (Game Master)

All provisioning is executed directly within the **Territory Grid Admin Panel** by an account with role `ADMIN`.

### 2.1 Step 1: Checkpoint & Clue Registry
1. Log in to Territory Grid as `ADMIN`.
2. Navigate to the **Clues** tab (compass icon on bottom navigation).
3. For each physical checkpoint, tap **Add Clue**:
   - **Zone ID**: Unique identifier matching station placards (e.g., `ZONE_01`, `ZONE_02`, ..., `ZONE_10`).
   - **Zone Label**: Human-readable name (e.g., `Sector A: Library Arch`, `Sector B: Solar Obelisk`).
   - **Clue Directive**: The riddle or directional hint guiding squads to this station.
4. *Tip:* For instant demonstration or testing, tap **SEED DEMO OPERATIONAL DATA** in the Control tab to automatically generate 10 standard clues and 4 squads.

### 2.2 Step 2: Squad (Team) Registration
1. Navigate to the **Teams** tab (groups icon).
2. Tap **Add Team** to create each competing squad (e.g., `Team Titans`, `Team Explorers`, `Code Warriors`, `Dream Squad`).
3. Registered squads initially start with `0 PTS` and an empty clue queue.

### 2.3 Step 3: Rotated Clue Order Generation
To prevent squads from colliding at the same station at mission launch:
1. Navigate to the **Control** tab.
2. Tap **FORCE GLOBAL RESHUFFLE**.
3. The preview dialog displays the randomized route for each squad, automatically offsetting the starting station so Team 1 starts at Zone 1, Team 2 starts at Zone 2, etc.
4. Tap **CONFIRM & BROADCAST ROUTE ASSIGNMENTS**.

### 2.4 Step 4: Operative Account Provisioning
1. Navigate to the **People** tab (badge icon).
2. **Provision Field Marshals (Role: MEMBER)**:
   - Tap **Add User** → Select role `FIELD MARSHAL`.
   - Enter Callsign (e.g., `Marshal Alpha`) and Email.
   - Tap **GENERATE** for a secure cyber password, then tap the copy icon.
   - Select their assigned **Zone ID** (e.g., `ZONE_01`).
   - Tap **SAVE OPERATIVE**. *(The Admin account remains signed in via secondary auth instance).*
3. **Provision Competitors (Role: PLAYER)**:
   - Tap **Add User** → Select role `PLAYER`.
   - Enter Callsign and Email.
   - Tap **GENERATE** for password.
   - Select their assigned **Squad (Team ID)**.
   - Tap **SAVE OPERATIVE**.
4. Distribute credentials securely to Marshals and Squad Captains.

---

## 3. Live Event Execution Protocol

```
+-------------------------------------------------------------------------------+
|                             MISSION TIMELINE                                  |
+-------------------------------------------------------------------------------+
|  T - 30 MIN  | Checkpoint Deployment & Physical Cones / Decks Staged          |
|  T - 15 MIN  | Advance to MEMBER_PHASE // Marshals Check-in & Station Lock    |
|  T - 00 MIN  | Advance to PLAYER_PHASE // Mission Clock Starts, Hunt Begins   |
|  T + 45 MIN  | Live Standings Monitoring & Field Marshal Telemetry Tracking   |
|  T + 90 MIN  | Mission Freeze // Advance to ENDED, Export Leaderboard         |
+-------------------------------------------------------------------------------+
```

### 3.1 T - 15 Minutes: Advance to `MEMBER_PHASE`
1. In the **Control** tab, tap **ADVANCE TO MARSHAL PHASE**.
2. Field Marshals launch their devices and log in:
   - Their screens lock specifically to their assigned `zoneId`.
   - Squad arrivals are disabled until the hunt is officially launched.
3. Competitor screens show **"PRE-MISSION BRIEFING"** with radar sweeps.

### 3.2 T - 00 Minutes: Launch Live Hunt (`PLAYER_PHASE`)
1. In the **Control** tab, tap **LAUNCH LIVE HUNT (PLAYER PHASE)**.
2. The mission clock initiates synchronously using server timestamps.
3. Every squad's device immediately reveals their active Directive #1.
4. Field Marshal check-in buttons unlock for arrived squads.

### 3.3 Field Marshal Station Flow (During the Hunt)
When a squad arrives at a checkpoint:
1. **Step 1 - Select Team**: Field Marshal selects the arriving squad from the dropdown.
   - *Validation:* Squads due at this checkpoint are highlighted in cyan (`DUE HERE`). Out-of-order squads or squads already checked in are blocked.
2. **Step 2 - Select Cone**: Marshal taps the cone color chosen or drawn by the squad (Red +10, Yellow +12, or Green +15).
3. **Step 3 - Draw Card**: Squad draws a physical card from the marshal's deck. Marshal taps the matching Rank (Ace through King) and Suit on their screen.
4. **Step 4 - Verify Math**: The dynamic preview displays: `[Cone] + [Card] = [Total Points]`.
5. **Step 5 - Confirm & Transmit**: Marshal taps **CONFIRM CHECK-IN TRANSMISSION**, reviews the pre-flight dialog, and taps **EXECUTE TRANSMISSION**.
6. The atomic write commits, points award instantly, card is added to the squad's inventory, and the squad's app reveals Directive #2.

---

## 4. Exceptional Event Management (Game Master Actions)

### 4.1 Weather / Emergency Halt (`PAUSE OPS`)
1. If lightning, traffic, or safety issues arise, tap **PAUSE OPS** in the Control tab.
2. The mission clock pauses immediately.
3. All Player screens show a prominent tactical **"OPERATIONS PAUSED"** overlay with active instructions to hold in place.
4. Field check-ins are temporarily locked.
5. Tap **RESUME OPS** when safe to continue. The mission clock resumes accurately without clock drift.

### 4.2 Reversing an Erroneous Check-in (Atomic Undo)
If a Marshal accidentally selects the wrong squad or card:
1. Game Master opens the **Live** tab.
2. Locate the faulty check-in in the **CHECK-IN TRANSMISSIONS** feed.
3. Tap **UNDO**.
4. Review the details (points to deduct, card to remove, step to roll back) and confirm.
5. The Firestore batch atomically restores the squad's score, deck, and clue index.

### 4.3 Network Dead Zones & Offline Grace Period
- If a checkpoint has poor cellular reception, the app operates uninterrupted via **Firestore persistent offline cache**.
- Submissions will display an amber `PENDING` badge and queue safely in device storage.
- As soon as the Marshal walks into Wi-Fi or cellular coverage, all queued batches automatically sync with full server timestamp integrity.

---

## 5. Mission Freeze & Victory Ceremony

### 5.1 Freezing the Leaderboard
1. When time expires, Game Master taps **END MISSION & FREEZE LEADERBOARD**.
2. State transitions to `ENDED`.
3. All competitor apps display final scores and rank podiums.
4. Further check-in submissions are rejected by server security rules.

### 5.2 Standings Export
1. In the **Live** tab, tap **SHARE STANDINGS REPORT**.
2. Select your preferred communication channel (WhatsApp, Email, Telegram, AirDrop) to publish the official text standings:
```
=========================================
TERRITORY GRID // MISSION LEADERBOARD
Status: ENDED
=========================================
#1 Team Titans — 184 PTS (8 Cards)
#2 Code Warriors — 162 PTS (7 Cards)
#3 Dream Squad — 145 PTS (6 Cards)
#4 Team Explorers — 118 PTS (5 Cards)
=========================================
Generated via Territory Grid Tactical Protocol
```

### 5.3 Resetting for Subsequent Heats
1. To run another heat with the same checkpoints: tap **RESET GRID**.
2. Type `"RESET"` in capital letters and confirm.
3. All check-in documents are deleted in batches of ≤400, scores reset to zero, card inventories clear, and the game reverts to `LOBBY`.
