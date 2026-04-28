# Ad-Strangle: Autonomous Heuristic Forensic Engine

**Unmasking the Dark Revenue Chains of Digital Piracy.**

Ad-Strangle is a high-fidelity forensic telemetry suite designed to expose and document the hidden ad-revenue streams that fund digital piracy ecosystems. By deploying autonomous agents that mimic human browsing behavior, Ad-Strangle penetrates obfuscated redirect chains and captures legally actionable evidence of brand exploitation.

---

## 🎯 Mission Overview
The digital piracy economy survives on "phantom" ad revenue. Premium brands often unknowingly fund these sites through complex, multi-layered ad-network redirects. Ad-Strangle was engineered to unmask these diversions, providing brand protection units with a certified "Money Trail" from initial asset ingestion to the final brand payout.

---

## 🕵️ The 'Sniffer Protocol'
Unlike traditional crawlers that fail at the first sign of a bot-trap, Ad-Strangle utilizes the proprietary **Sniffer Protocol**. 

### Technical Merit:
*   **Header Interception**: Instead of relying on DOM-based navigation, the engine intercepts raw `HTTP 3xx` response headers. This allows it to "sniff" the destination URL even if the tracking server is returning a **Cloudflare 522 (Connection Timed Out)** or other "dead-end" status codes.
*   **Behavioral Probing**: The agent executes a multi-strike interaction pattern (Search probing, viewport clicks, and input hesitation) to trigger ad-network overlays that are invisible to static scanners.
*   **Manual Jump Recovery**: When a destination is identified in the headers but the page fails to load, the engine executes a forced manual jump to the final destination to secure the forensic capture.

---

## 📊 Verified Case Study: The MySmartPrice Incident
In a live operational test, Ad-Strangle successfully mapped a complex revenue diversion chain:
1.  **Origin**: `hdhub4u.fo` (Pirate Streaming Site).
2.  **The Hijack**: An interaction probe triggered a series of redirects through `turnhub.net` and `phaseganging` nodes.
3.  **The Payout**: The chain stabilized on a high-value landing page: a **Google Display Network (GDN)** campaign for Lava smartphones on `MySmartPrice.com`.
4.  **Forensic Proof**: The system captured the full redirect sequence, the tracker's 522 error state, and the final stabilized brand destination, generating a certified audit log within 80 seconds.

---

## 🏗️ Core Architecture

### Heuristic Core
Built on a hardened **Playwright** foundation, the core engine manages the lifecycle of the "Sniffer" agents. It handles browser context isolation, request aborting (to bypass static media traps), and persistent network sniffing.

### Vision Layer
Powered by **Gemini 3 Flash**, the Vision Layer performs real-time visual intent verification. It analyzes landing page screenshots to identify the commercial entity (brand) being exploited, providing high-accuracy labeling for the forensic database.

### Forensic Pipeline
*   **Real-time Telemetry**: Powered by **Firebase Firestore**, providing a live "Forensic Discovery Feed" on the Telemetry Center dashboard.
*   **Certified PDF Generation**: Utilizes `jsPDF` and `jspdf-autotable` to produce multi-page, legally actionable audit logs that visualize every phase of the diversion chain.

---

## 🚀 Deployment & Setup

### Environment Configuration
1.  Clone the repository.
2.  Copy `.env.example` to `.env.local`.
3.  Populate the following variables:
    *   `GEMINI_API_KEY`: For the Heuristic Vision Layer.
    *   `NEXT_PUBLIC_FIREBASE_*`: For telemetry persistence.

### Docker-Based Deployment
Ad-Strangle is optimized for containerized environments to ensure consistent browser performance.

```bash
# Build the forensic image
docker build -t ad-strangle .

# Launch the Telemetry Center
docker run -p 3000:3000 --env-file .env.local ad-strangle
```

---

## ⚖️ Legal Notice
Ad-Strangle is a forensic tool intended for use by authorized Brand Protection Units and Cyber-Intelligence professionals. Users are responsible for ensuring compliance with local laws regarding web scraping and digital forensics.

---
**Ad-Strangle: Surgical Precision in Revenue Protection.**
