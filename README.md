# FieldPilot — OfflineFirst AI Autonomous Agent Platform

> **"Internet availability must not determine whether a field worker can create, store, and complete critical local tasks."**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.162.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB.svg)](https://react.dev/)
[![IndexedDB](https://img.shields.io/badge/Persistence-Dexie.js_IndexedDB-orange.svg)](https://dexie.org/)
[![PWA](https://img.shields.io/badge/PWA-Service_Worker_Ready-5A0FC8.svg)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Problem Statement & Mission

In rural areas, disaster zones, and agricultural frontiers, field workers, village administrators, and NGO teams face intermittent or non-existent cellular connectivity. Traditional cloud-dependent AI systems fail completely when the network drops.

**FieldPilot** is an open-source, offline-first autonomous agent platform engineered to:
1. Run lightweight, grounded AI models locally on the device with zero cloud connectivity or API keys required.
2. Complete queued tasks offline with deterministic heuristics, entity extraction, and structured civic action generation.
3. Manage limited hardware resources (device battery consumption, low-power throttling, and IndexedDB storage quotas).
4. Persist all tasks in IndexedDB and an offline sync outbox queue.
5. Reliably synchronize verified results when network connectivity returns using revision tracking and 3-way conflict resolution.
6. Enforce strict safety guardrails: **The agent is strictly forbidden from claiming that a repair has occurred without verified evidence.**

---

## 2. End-to-End Core Workflow

```mermaid
graph TD
    A["Report Ingestion (Text/Speech Preset)"] --> B["Save to Local IndexedDB (Draft)"]
    B --> C["Execute Local Autonomous Agent"]
    C --> D["Entity & Population Extraction"]
    D --> E["Priority Scoring & Role Routing"]
    E --> F["Safety Guardrail Check (Human Verification Flag)"]
    F --> G["Enqueued in Sync Outbox (Pending)"]
    G --> H{"Network Available?"}
    H -- "Offline" --> I["Retained in Persistent IndexedDB Outbox"]
    H -- "Online / Reconnected" --> J["Batch Push to Server (/api/sync/push)"]
    J --> K{"Revision Check"}
    K -- "Match / Newer" --> L["Server Merged & Acknowledged ✓"]
    K -- "Stale / Concurrent Edit" --> M["Conflict Flagged -> 3-Way Merge UI"]
```

---

## 3. Technology Stack

### Frontend & Offline Runtime
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Glassmorphism design system + Lucide icons
- **Client Persistence**: Dexie.js (IndexedDB wrapper) with reactive `useLiveQuery`
- **Offline Capabilities**: Progressive Web App (PWA) manifest & Service Worker shell caching
- **Hardware Telemetry**: Battery Status API & Storage Estimation API integration with interactive testing slider
- **Network Simulator**: In-app toggling between **Online**, **Flaky 2G (High Latency)**, and **Deep Offline**

### Backend & API
- **Framework**: Python 3.11+ / 3.13 with FastAPI
- **Database**: SQLite with SQLAlchemy 2.0 ORM (`fieldpilot.db`)
- **Validation**: Pydantic v2 schemas with timezone-aware datetime serialization
- **Synchronization**: Batch push/pull protocol with idempotency keys and server revision tracking
- **Testing**: Automated backend test suite running under `pytest`

### Agent Runtime
- **Deterministic Heuristic Engine**: On-device, zero-dependency, ultra-fast rule-based NLP agent optimized for rural infrastructure, public health, agriculture, and civic utilities.
- **Pluggable LocalModelProvider Interface**: Pluggable interface supporting local LLM inference engines like **Ollama** (`http://localhost:11434`) and **llama.cpp** (`http://localhost:8080`).

---

## 4. Default Benchmark Demonstration: Village Hand Pump Breakdown

The platform includes a built-in verified benchmark test case representing a real-world rural failure:

> **Report:** *"The hand pump near the village primary school has stopped working. Around 40 families depend on it."*

When executed by FieldPilot:
1. **Domain Classification**: Categorized as `water_supply` (Confidence: 94%).
2. **Entity & Impact Extraction**:
   - Detected Location: `Near Village Primary School, Sector 2`
   - Estimated Affected Population: `40 families (~200 villagers)`
3. **Deterministic Priority Scoring**: Evaluated as `CRITICAL` due to primary school proximity and high dependent household count.
4. **Actionable Civic Directives**:
   - *Directive 1*: Dispatch Block Water Supply Mechanical Team to inspect cylinder, chain, and riser pipe.
   - *Directive 2*: Coordinate emergency 3,000L Potable Water Tanker delivery for the primary school and 40 families.
   - *Directive 3*: Water Quality & Borewell Static Level test by Field Health Inspector.
5. **Safety Guardrail**: `verified_evidence: false` and `needs_human_verification: true`. The system enforces that no task can be marked as "Repaired" without verified physical on-site evidence.
6. **Replication**: Stored locally in IndexedDB; queued into outbox; automatically synced to SQLite server upon connection.

---

## 5. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18+) and npm
- Python (3.11+)

### 1. Clone & Setup Backend
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest tests

# Launch backend API server (runs at http://127.0.0.1:8000)
python run_backend.py
```

### 2. Setup & Launch Frontend
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Verify production build
npm run build

# Start Vite development server (runs at http://127.0.0.1:5173)
npm run dev
```

Open `http://127.0.0.1:5173` in your browser.

---

## 6. Application Routes

| Route | View | Description |
|---|---|---|
| `#/dashboard` | **Overview Dashboard** | KPI metrics, battery/hardware governance widget, benchmark demo runner, recent tasks. |
| `#/tasks` | **Tasks & Incidents List** | Filterable by Category (Water, Agriculture, Healthcare, Infrastructure, Education), Status, and Priority. |
| `#/new` | **New Field Report** | Incident form with 4 quick-fill benchmark presets and instant local agent execution. |
| `#/sync` | **Sync Hub & Outbox** | Persistent outbox queue, network simulator controls (Online / 2G / Offline), and 3-way conflict resolver. |
| `#/agent` | **Agent Studio & Hardware** | Model provider selector (Deterministic vs Ollama), battery saver threshold slider, and raw agent sandbox. |

---

## 7. Hardware Resource Governance

Field devices operating in rural zones suffer from rapid battery drain and limited storage:
- **Low Power Throttling Mode**: When battery falls below the configured threshold (default 20%) and the device is not plugged in, heavy background queue execution is deferred to preserve battery for critical communications.
- **Storage Quota Management**: Storage is bounded using IndexedDB with automatic audit log pruning and telemetry tracking.
- **Energy Metric**: The deterministic engine executes in ~35ms with an estimated energy footprint of only ~0.04 mWh per task.

---

---

## 8. Smart Task Priority Assistant & Smart Offline Sync Monitor

### Feature 1: Smart Task Priority Assistant
The Smart Task Priority Assistant is an autonomous, transparent, 100% offline rule engine ([frontend/src/services/priorityAssistant.ts](file:///c:/Users/madha/Downloads/Nithin/frontend/src/services/priorityAssistant.ts)) that dynamically evaluates field incidents without requiring cloud AI APIs or internet access.

- **Deterministic Urgency Scoring (0–100 Scale)**:
  - **Critical Keywords (+25 to +40 pts)**: Detects immediate hazards such as `contamination`, `epidemic`, `outbreak`, `collapse`, `failure`, `broken`, `hazard`, and `flood`.
  - **Sensitive Infrastructure (+20 pts)**: Recognizes institutions like `school`, `hospital`, `clinic`, `ward`, and `daycare`.
  - **Domain Base Weights (+15 to +30 pts)**: `healthcare` (+30), `water_supply` (+25), `infrastructure` (+20), `agriculture` (+15).
  - **Population Density Scaling (+10 to +25 pts)**: Scales dynamically based on affected headcounts extracted from incident reports.
  - **Routine Incident Deduction (-25 pts)**: De-escalates routine maintenance keywords like `routine`, `inspection`, `annual`, `scheduled`, `minor cosmetic`.
- **Classification Output**:
  - `HIGH` (Score $\ge 70$): Immediate intervention required; critical safety hazards or vulnerable populations affected.
  - `MEDIUM` (Score $35–69$): Scheduled intervention required; moderate disruption or non-acute public impact.
  - `LOW` (Score $< 35$): Deferrable or routine task; maintenance inspection or cosmetic issues.
- **Transparent Explanations & Next Action Directives**:
  - Provides a human-readable **Contextual Reason** (e.g., *"High-impact civic issue affecting school/clinic infrastructure or 50+ residents; requires swift dispatch."*).
  - Generates a **Practical Suggested Next Action** (e.g., *"Deploy emergency repair technician and allocate potable water relief within 6 hours."*).
  - Displays a detailed **Factors Breakdown** in the task modal for operational transparency.
- **Full Backward & Forward Compatibility**:
  - Automatically maps legacy database priorities (`critical`, `high`, `medium`, `low`) to and from assistant priority levels (`HIGH`, `MEDIUM`, `LOW`).
  - Filterable on the **Tasks Page** dropdown with instant live updates.

---

### Feature 2: Smart Offline Sync Monitor
The Smart Offline Sync Monitor ([frontend/src/components/SmartSyncMonitor.tsx](file:///c:/Users/madha/Downloads/Nithin/frontend/src/components/SmartSyncMonitor.tsx)) provides real-time operational visibility into data persistence, network status, and replication synchronization.

- **Dual-Layer Connectivity Detection**:
  - **Browser Interface**: Listens to native `online`/`offline` window events.
  - **Backend Reachability Probe**: Periodically pings `/api/health` with a 3-second timeout to differentiate between active internet connection and actual backend API accessibility.
  - **Latency Measurement**: Displays round-trip server response time in milliseconds.
- **Real Application Metric Counters (Powered by IndexedDB/Dexie)**:
  - **Pending**: Local mutations waiting in the persistent outbox queue.
  - **Syncing**: Operations currently being transmitted to the server.
  - **Synced**: Tasks successfully acknowledged and committed by the backend.
  - **Failed**: Operations that exceeded retry thresholds or encountered non-recoverable errors.
  - **Conflicts**: Incidents where concurrent edits require 3-way conflict resolution.
- **Persistent Outbox Queue Inspector**:
  - Outbox records survive browser refreshes and system restarts in IndexedDB.
  - Collapsible drawer reveals operation type (`create_task`, `update_task`), entity ID, retry attempts, last error message, and formatted payload preview.
- **Resilient Retry & Exponential Backoff Policy**:
  - Calculates backoff delay dynamically: $\text{delay} = \min(30000, 1000 \times 2^{\text{retries}})$.
  - Max retry cap: 5 attempts before marking as `failed`.
- **Manual Actions & Concurrency Mutex**:
  - **Sync Now**: Triggers immediate outbox flush with concurrency lock to avoid duplicate server submissions.
  - **Retry Failed**: Resets retry counters on failed operations and automatically attempts resynchronization.

---

## 9. Multilingual Voice Copilot & Offline Field Worker System

### 1. OfflineFirst Voice Copilot — Speak Naturally, Get Answers in Your Language
The Voice Copilot ([frontend/src/pages/VoiceCopilotPage.tsx](file:///c:/Users/madha/Downloads/Nithin/frontend/src/pages/VoiceCopilotPage.tsx)) provides a multilingual, natural voice-to-voice interface tailored for rural farmers and field teams:

- **Strict Language Priority Ordering**:
  1. **Kannada (`kn-IN`)**: `ಕನ್ನಡ` — Primary regional language.
  2. **Hindi (`hi-IN`)**: `हिन्दी`
  3. **Telugu (`te-IN`)**: `తెలుగు`
  4. **Tamil (`ta-IN`)**: `தமிழ்`
  5. **English (`en-US`)**: Rural Advisory Mode.
- **Natural Voice-to-Voice Pipeline**:
  - **Push-to-Talk Recording**: Microphone stream active only during press; clean hardware release immediately upon release to prevent background drain.
  - **Microphone Feedback Guard**: Speech recognition automatically mutes during speech synthesis to avoid acoustic echo loops.
  - **Local Speech Synthesis**: Reads answers aloud in the selected language with speed calibrated for clarity; includes replay, repeat, and cancel controls.
- **Verified Local Agricultural Knowledge Base ([frontend/src/services/localKnowledgeService.ts](file:///c:/Users/madha/Downloads/Nithin/frontend/src/services/localKnowledgeService.ts))**:
  - On-device verified guidance for South Indian crops:
    - **Arecanut (ಅಡಿಕೆ)**: Koleroga (Fruit rot) 1% Bordeaux mixture prophylaxis and drainage management.
    - **Paddy (ಭತ್ತ)**: Blast disease moisture control and chemical nitrogen top-dressing precautions.
    - **Ragi (ರಾಗಿ)**: Seed treatment and 22.5 x 10 cm aeration spacing.
    - **Tomato (ಟೊಮೆಟೊ)**: Leaf curl vector suppression with yellow sticky traps.
    - **Civic Water**: Borewell hand pump chain, riser pipe, and foot valve diagnostics.
  - Provenance citations: UAS Bangalore, ICAR-CPCRI, IIHR Hessaraghatta, and Karnataka Agriculture Handbooks.
  - Interactive clarifying questions when symptoms or crop stages require additional context.
  - Crop photo query attachment support.

---

### 2. Offline Field Worker — Capture, Analyze, and Sync Anywhere
The Field Worker module ([frontend/src/pages/FieldWorkerPage.tsx](file:///c:/Users/madha/Downloads/Nithin/frontend/src/pages/FieldWorkerPage.tsx)) enables on-site public works and civil inspections:

- **Comprehensive Field Inspection Form**:
  - Title, Category (`water_supply`, `agriculture`, `healthcare`, `infrastructure`, `education`), and Severity (`critical`, `high`, `medium`, `low`).
  - Detailed description and on-site field notes.
  - **Photographic Evidence**: Supports multiple JPEG, PNG, and WebP attachments from device camera or local gallery with thumbnail previews and deletion.
  - **GPS Coordinate Capture**: Captures real GPS latitude, longitude, and accuracy via `navigator.geolocation` with graceful offline fallback when permission is denied.
- **Durable Local-First Persistence**:
  - All report metadata and photo attachments (as base64/blobs) are committed transactionally to local IndexedDB (`FieldPilotDB`) **before any network request is initiated**.
  - Completely persists across browser restarts, device reboots, and deep offline periods.
- **AI Report Assistant**:
  - Evaluates inspection text, suggests categories and severity levels, highlights missing observation fields (e.g., affected household headcount, physical landmarks), and generates supervisor briefs without overwriting raw field observations.

---

### 3. Resource-Aware Agent Task Scheduler
Implemented in [frontend/src/services/taskScheduler.ts](file:///c:/Users/madha/Downloads/Nithin/frontend/src/services/taskScheduler.ts):

- **Strict Priority Queue**:
  1. `critical`: Immediate hazard report synchronization & safety actions.
  2. `high`: High-severity infrastructure updates.
  3. `medium`: Standard report & photo synchronization.
  4. `low`: Routine maintenance logs and background AI tasks.
- **Battery-Aware Governance**:
  - Detects device battery level via Hardware Battery Status API.
  - When battery falls below threshold (default 20%) without AC power, heavy non-critical tasks are deferred to conserve energy for critical communication.

---

### 4. Supervisor Dashboard
Implemented in [frontend/src/pages/SupervisorPage.tsx](file:///c:/Users/madha/Downloads/Nithin/frontend/src/pages/SupervisorPage.tsx):

- Connects to central backend `/api/reports` to display inspection records that have **actually been persisted and acknowledged** by the server database.
- Displays full inspection details, attached photographic evidence, GPS location, timestamps, worker IDs, and executive AI briefs.
- Truthful reporting: clearly distinguishes between server-persisted records and browser-local draft records.

---

### 5. Secure Server-Side Gemini AI Configuration
Implemented in [backend/app/routers/ai.py](file:///c:/Users/madha/Downloads/Nithin/backend/app/routers/ai.py) and [frontend/src/services/aiProviderService.ts](file:///c:/Users/madha/Downloads/Nithin/frontend/src/services/aiProviderService.ts):

- **Three Explicit Operating Modes**:
  - **Online Mode**: Uses Google Gemini AI (`gemini-2.5-flash`) through the secure backend proxy `/api/ai/chat` and `/api/ai/analyze-report`.
  - **Hybrid Mode**: Checks verified local knowledge first; invokes cloud AI only when authorized and backend is reachable; falls back cleanly to on-device rules if connection drops.
  - **Strict Offline Mode**: Strictly refuses any cloud API requests; utilizes 100% on-device knowledge base and deterministic NLP heuristics.
- **Zero Secret Exposure**:
  - `GEMINI_API_KEY` is loaded and validated **strictly server-side**.
  - Never returned to the client, never included in bundles, never stored in IndexedDB/localStorage, and ignored from Git via `.gitignore`.
- **Configuring the API Key**:
  - For local development: add `GEMINI_API_KEY=your_key_here` to `backend/.env`.
  - For production / Vercel: set `GEMINI_API_KEY` in the server environment variables.

---

## 10. Repeatable Hackathon Demonstration Procedure

To demonstrate the full unified offline-first system live:

1. **Launch the Application**:
   - Backend: `cd backend && .venv\Scripts\activate && python run_backend.py` (Runs at `http://127.0.0.1:8000`).
   - Frontend: `cd frontend && npm run dev` (Opens `http://127.0.0.1:5173`).
2. **Open Voice Copilot (`#/voice`)**:
   - Select **Kannada (ಕನ್ನಡ)**.
   - Click a quick sample question: *"ಅಡಿಕೆ ಬೆಳೆಯಲ್ಲಿ ಕೊಳೆ ರೋಗ ಬಂದಿದೆ, ಬೋರ್ಡೋ ದ್ರಾವಣ ಹೇಗೆ ತಯಾರಿಸಬೇಕು?"*
   - Observe the instant verified advisory response citing **ICAR-CPCRI & UAS Bangalore** with Bordeaux mixture ratios, and hear the audio response spoken in natural Kannada.
3. **Simulate Deep Offline Mode**:
   - In the top header simulator pill, toggle to **Deep Offline (No Internet)**.
   - Observe status badges update to `OFFLINE` and `Strict Offline`.
4. **Create Offline Field Inspection Report (`#/field`)**:
   - Enter Title: *"Village Borewell Hand Pump Chain Snapped"*.
   - Category: `Water Supply`, Severity: `High`.
   - Click **Capture Location** (captures GPS coordinates).
   - Attach two inspection photos.
   - Click **Save Locally (Offline Safe)**.
   - Notice the report and photos are immediately saved to local IndexedDB.
5. **Verify Persistence Across Reload**:
   - Hard refresh the browser (`Ctrl + F5`) while offline.
   - Navigate back to `#/field` and `#/sync`. Notice the report, photos, and outbox queue items **remain 100% intact**.
6. **Reconnection & Server Persistence**:
   - Toggle network simulator back to **Online (Connected)**.
   - Click **Sync Now** in the Sync Hub.
   - The pending report and attachments are uploaded to `/api/reports` and `/api/reports/{id}/attachments`.
7. **Verify on Supervisor Dashboard (`#/supervisor`)**:
   - Navigate to `#/supervisor`.
   - See the synchronized report appear with evidence photos, GPS coordinates, and executive brief retrieved directly from the central SQLite database.

---

## 11. Verification & Automated Test Results

| Test Category | Suite / Command | Total Tests | Status | Details |
|---|---|---|---|---|
| **Frontend Priority & Sync** | `node src/test/priorityAndSync.test.ts` | 46 | **PASSED** | 100% passing (scoring, rules, legacy mapping, backoff) |
| **Frontend Voice & Field Worker** | `node src/test/unifiedMegaFeatures.test.ts` | 60 | **PASSED** | 100% passing (Kannada priority, knowledge queries, modes, photo validation) |
| **Backend API, Sync & Reports** | `.venv\Scripts\python -m pytest backend/tests` | 16 | **PASSED** | 100% passing (reports CRUD, attachments, health, AI offline fallback) |
| **Frontend Production Build** | `npm run build` (`tsc -b && vite build`) | — | **PASSED** | Zero errors; bundles generated cleanly in 607ms |
| **Live Remote Gemini AI Call** | `POST /api/ai/chat` (without API key) | — | **BLOCKED (Safe)** | Safely caught missing credential; fell back to verified local knowledge |

---

## 12. License

Open source under the [MIT License](LICENSE). Built for rural resilience, farmer empowerment, and offline-first autonomous AI systems.
