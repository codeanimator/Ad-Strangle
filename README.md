# 🕵️‍♂️ Ad-Strangle: Autonomous Heuristic Forensic Engine

**Unmasking the "Phantom Economy" that funds digital piracy through brand exploitation.**

---

## 🎥 Demo & Proof of Concept
[![Ad-Strangle Demo Video](https://img.youtube.com/vi/e0N4bWGSrd4/maxresdefault.jpg)](https://youtu.be/e0N4bWGSrd4)  
*Click above to watch the 2-minute technical walkthrough*

---

## 🚀 Deployment Links
* **Live Forensic Dashboard:** [https://ad-strangle-590911868383.us-central1.run.app](https://ad-strangle-590911868383.us-central1.run.app)
* **Technology:** Google Cloud Run, Gemini 3 Flash, Firebase

---

## 🎯 Mission Overview
Digital piracy survives on "phantom" ad revenue. Premium brands often unknowingly fund these sites through complex, multi-layered ad-network redirects. **Ad-Strangle** was engineered to unmask these diversions, providing brand protection units with a certified "Money Trail" from initial asset ingestion to the final brand payout.

---

## 🕵️ The 'Sniffer Protocol'
Unlike traditional crawlers that fail at the first sign of a bot-trap, Ad-Strangle utilizes a proprietary **Sniffer Protocol** to maintain visibility throughout the redirect chain.

### Technical Merit:
* **Header Interception**: Instead of relying solely on DOM-based navigation, the engine intercepts raw `HTTP 3xx` response headers. This allows it to "sniff" the destination even if the tracking server returns a **Cloudflare 522 (Connection Timed Out)** or other "dead-end" status codes.
* **Behavioral Probing**: The agent executes a multi-strike interaction pattern (viewport clicks, hesitation scrolling) to trigger ad-network overlays that are invisible to static scanners.
* **Manual Jump Recovery**: When a destination is identified in the headers but the page fails to load, the engine executes a forced manual jump to the final destination to secure the forensic capture.

---

## 🏗️ Core Architecture

### 🧠 Vision Layer (Gemini 3 Flash)
Powered by **Google Gemini**, the Vision Layer performs real-time visual intent verification. It analyzes landing page screenshots to identify the commercial entity (brand) being exploited, providing high-accuracy labeling for the forensic database.

### 🛡️ Heuristic Core (GCP & Playwright)
Built on a hardened **Playwright** foundation and deployed on **Google Cloud Run**, the core engine manages the lifecycle of the "Sniffer" agents. It handles browser context isolation, request aborting, and persistent network sniffing.

### 📜 Forensic Pipeline
* **Real-time Telemetry**: Powered by **Firebase Firestore**, providing a live "Forensic Discovery Feed" on the dashboard.
* **Certified Audit Logs**: Produces multi-page, legally actionable PDF audit logs visualizing every phase of the diversion chain.

---

## 📊 Verified Case Study: The MySmartPrice Incident
In a live operational test, Ad-Strangle successfully mapped a complex revenue diversion:
1. **Origin**: `hdhub4u.fo` (Pirate Streaming Site).
2. **The Hijack**: Interaction probe triggered redirects through `turnhub.net` and `whumpupturn.help` nodes.
3. **The Payout**: The chain stabilized on a **Google Display Network** campaign for Lava mobiles on `MySmartPrice.com`.
4. **Forensic Proof**: The system captured the full redirect sequence, even bypassing the tracker's 522 error state, to generate a certified audit log in 80 seconds.

---

## 🛠️ Deployment & Setup

### Docker-Based Deployment
Ad-Strangle is optimized for containerized environments to ensure consistent forensic performance.

```bash
# Build the forensic image
docker build -t ad-strangle .

# Launch the Telemetry Center
docker run -p 3000:3000 --env-file .env.local ad-strangle
