<div align="center">
<img width="1200" height="475" alt="MediBridge AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🏥 MediBridge AI
**Bridging Unstructured Medical Data with Personalized Health Insights**

MediBridge AI is a secure, Gemini-powered platform designed to empower patients by transforming fragmented medical documents (prescriptions, lab reports, clinical notes) into a structured, actionable health history.

---

## 🎯 Chosen Vertical
**Healthcare / Personal Health Management**
*Empowering individuals and families to maintain a private, AI-analyzed medical record that bridges the gap between patient and provider.*

---

## 🧠 Approach and Logic

### 1. Vision
The core philosophy of MediBridge AI is **"Privacy by Design."** We handle highly sensitive medical information using a multi-layered approach:
- **Intelligent Extraction**: Instead of just OCR, we use **Gemini 1.5 Flash** to perform clinical data extraction, identifying specific biomarkers, dosages, and diagnostic summaries.
- **Family Profiles**: Medical history is seldom individual; our app supports multiple family profiles (Self, Spouse, Child, etc.) to manage a household's health in one place.
- **Resilient Infrastructure**: We implemented an exponential backoff system for all AI calls to ensure uptime even during API rate limits.

### 2. Logic Flow
1. **Intake**: A user drops a photo or PDF of a medical document into the secure dropzone.
2. **AI Processing**: Gemini 1.5 Flash analyzes the image, converts it to structured JSON, and normalizes medical terminology.
3. **Storage**: Structured data is stored in **Cloud Firestore** under user-specific collections, protected by strict security rules.
4. **Insight Layer**: The app aggregates lab results over time, using **Recharts** to visualize trends (e.g., cholesterol or blood sugar levels).
5. **Direct Interaction**: A personalized **Chat Assistant** allows users to ask questions *only* based on their uploaded records, preventing hallucinations and ensuring context-aware answers.

---

## 🛠️ How it Works

### Features:
- **Smart Record Management**: Automatic categorization of documents (Lab Reports, Prescriptions, etc.).
- **Lab Trends**: Visual progress tracking of numeric biomarkers.
- **Privacy-First Assistant**: An AI chat that knows your history and warns when answers aren't in your data.
- **Full Compliance Dashboard**:
  - **Right to Erasure**: One-click permanent deletion of all health data (GDPR).
  - **Data Portability**: Download your history in structured JSON (GDPR).
  - **Audit Logs**: Immutable logs for every doctor access or data change (HIPAA).

### Installation:
1. **Clone**: `git clone [repo-url]`
2. **Install**: `npm install`
3. **Environment**: Rename `.env.example` to `.env` and add your `VITE_GEMINI_API_KEY` and Firebase credentials.
4. **Run**: `npm run dev`

---

## 🛡️ Evaluation Focus Areas

### 🔒 Security
- **Credential Hardening**: All keys are moved to protected environment variables.
- **Firestore Rules**: Implemented strict cross-user and schema validation.
- **Audit Trails**: Every sensitive action is logged to an immutable collection.

### ⚡ Efficiency
- **Offline Mode**: Enabled Firestore offline persistence for faster loading.
- **Memoization**: All heavy chart calculations and UI state updates use `React.useMemo` to optimize performance.

### ♿ Accessibility
- Full ARIA compliance with keyboard-navigable elements.
- Inclusive design system with high contrast and readable typography.

### 🧪 Testing
- Comprehensive unit tests using **Vitest** for both the UI components and the compliance logic (AuditLogger).

---

## 📝 Assumptions & Constraints
- **Document Quality**: Users are assumed to upload legible photos or PDFs in English.
- **Clinical Data**: AI extraction is intended for informational tracking and is not a substitute for professional medical advice.

---

<p align="center">Made with ❤️ for the Google Antigravity Challenge</p>
