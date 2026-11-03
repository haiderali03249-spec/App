# Haider — Offline Messaging System

> **Connect Nearby. Message Freely.**
> Completely offline, device-to-device peer-to-peer messaging system with private chats, group messaging, and end-to-end encryption.
> **Support Contact:** `03249192862`

---

## 🚀 GitHub Setup & Automated APK Build (CI/CD)

Is repository mai automated **GitHub Actions CI/CD workflows** configure kar diye gaye hain taake jaise hi aap code GitHub par push karein, GitHub automatically:
1. **Android APK** build karega (`.apk` downloadable file ready ho jayegi).
2. **Web / PWA App** verify aur compile karega.

### 📁 Workflows Created in `.github/workflows/`:
1. `.github/workflows/android-build.yml`:
   - Ubuntu runner par JDK 17 aur Android SDK setup karta hai.
   - `android/` directory mai `./gradlew assembleDebug` run karta hai.
   - **`Haider-Offline-Messaging-APK`** artifact generate karke GitHub Actions tab mai upload karta hai jahan se aap direct `.apk` download kar saktay hain.
2. `.github/workflows/web-build.yml`:
   - Node.js environment setup karta hai.
   - Linting aur Vite compilation run karta hai.
   - `Haider-Web-PWA-Build` artifact upload karta hai.

---

## 🛠️ GitHub Par Code Push Kaise Karein:

Agar aap ne abhi tak repo GitHub par push nahi kiya, toh yeh commands run karein:

```bash
# 1. Initialize git (agar pehle se nahi hai)
git init

# 2. Add all files (including .github/workflows and android/)
git add .

# 3. Commit
git commit -m "Initial commit: Haider Offline Messaging System with GitHub Actions CI/CD"

# 4. Main branch set karein
git branch -M main

# 5. Apna GitHub repository URL add karein
git remote add origin https://github.com/YOUR_USERNAME/haider-offline-messaging.git

# 6. Push karein
git push -u origin main
```

---

## 📥 GitHub Se APK Download Kaise Karein:
1. Apne GitHub repository ke **Actions** tab par jayein.
2. Latest workflow run **"Build Android APK"** par click karein.
3. Page ke bottom par **Artifacts** section mai aapko **`Haider-Offline-Messaging-APK`** file mil jayegi.
4. Click karke download karein aur apne Android phone mai install karein!

---

## 📱 Android Studio Mai Direct Open Karne Ka Tareeqa:
1. Android Studio open karein.
2. **File > Open** select karein.
3. Is repository ke andar **`android/`** folder ko select karein.
4. Gradle sync complete hone dein aur **Run** (Play button) daba kar physical phone ya emulator par test karein.

---

## 🔒 Security & Architecture:
- **Zero Cloud / No Firebase:** Hardware-to-hardware communication via Google Nearby Connections (Bluetooth Low Energy & Wi-Fi Direct).
- **End-to-End Encryption:** NIST P-256 Elliptic Curve Diffie-Hellman (`ECDH`) key exchange + 256-bit `AES-GCM` authenticated payload encryption.
- **Strict Privacy:** Intercepted packets addressed to other peers are cryptographically unreadable and immediately dropped.
