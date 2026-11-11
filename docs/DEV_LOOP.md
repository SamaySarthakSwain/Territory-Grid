# Developer Loop & Helper Scripts Guide

This directory (`scripts/`) provides cross-platform automation tools for rapid development, testing, and UI verification on Windows (`.ps1`) and macOS/Linux (`.sh`).

---

## 🛠 Script Directory Overview

| Script | Purpose | Usage (PowerShell) | Usage (Bash) |
| :--- | :--- | :--- | :--- |
| `build` | Compiles debug APK, writes full log to `logs/build.txt`, echoes last 40 lines | `.\scripts\build.ps1` | `./scripts/build.sh` |
| `install_run` | Installs debug APK via Gradle and launches `MainActivity` with 3s wait | `.\scripts\install_run.ps1 [-DeviceSerial <id>]` | `./scripts/install_run.sh [device_serial]` |
| `logs` | Manages logcat: clears buffer (`clear`) or dumps app & error logs (`dump`) | `.\scripts\logs.ps1 <clear\|dump>` | `./scripts/logs.sh <clear\|dump>` |
| `shot` | Takes screen capture from connected device/emulator into `shots/<name>.png` | `.\scripts\shot.ps1 <name>` | `./scripts/shot.sh <name>` |
| `reset_app` | Executes `pm clear` for package `com.yourname.territorygrid` | `.\scripts\reset_app.ps1` | `./scripts/reset_app.sh` |

---

## 🔁 Typical Developer Workflow

### 1. Build and Verify
Whenever code is updated, compile and ensure the build succeeds:
```powershell
.\scripts\build.ps1
```
The output will stream to console and be preserved in `logs/build.txt`.

### 2. Deploy and Launch
Deploy the latest debug APK directly to an active emulator or attached physical phone:
```powershell
.\scripts\install_run.ps1
```

### 3. Debugging with Logcat
Clear stale logs before reproducing a scenario:
```powershell
.\scripts\logs.ps1 clear
```
After executing an action, dump the filtered logs:
```powershell
.\scripts\logs.ps1 dump
```
- Full application output is saved to `logs/app.txt`
- Errors and exceptions are saved to `logs/errors.txt`

### 4. Visual Verification (Pixel-Perfect QA)
When a screen or component is ready, take a snapshot:
```powershell
.\scripts\shot.ps1 login_screen
```
This saves `shots/login_screen.png`. Compare it against the corresponding design in `design_refs/screens/`.

### 5. Clean State Reset
To test fresh login or onboarding from a clean slate:
```powershell
.\scripts\reset_app.ps1
```
This instantly clears all local SharedPreferences, room/datastore, and cached Firestore auth tokens.
