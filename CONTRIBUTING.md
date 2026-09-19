# Contributing to Adiona

Thank you for your interest in contributing to Adiona (Chennai Safety Map). This project is an open-source, privacy-first civic safety network designed to help Chennai residents report and visualize infrastructure and personal safety concerns anonymously.

We welcome contributions from developers, designers, data analysts, and civic advocates of all experience levels.

---

## Table of Contents

1. Code of Conduct
2. Getting Started
3. Development Setup
   - Prerequisites
   - Backend Setup
   - Frontend Setup
4. Core Architectural Principles
   - Privacy-by-Design and Grid Snapping
   - Device Anonymity
   - Category Separation
5. Contribution Workflow
   - Branch Naming Conventions
   - Making Changes
   - Testing Requirements
   - Submitting a Pull Request
6. Issue Reporting and Feature Requests
7. Style Guides
   - Python Backend Guidelines
   - JavaScript and React Frontend Guidelines
   - CSS and Responsive Design Guidelines

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Contributors are expected to:

- Communicate respectfully and constructively.
- Focus on what is best for the community and civic safety.
- Gracefully accept constructive feedback.
- Respect diverse viewpoints and technical approaches.

Harassment, hate speech, abusive language, or discriminatory behavior will not be tolerated.

---

## 2. Getting Started

1. Fork the repository on GitHub:
   https://github.com/Vijajraj/Adiona

2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Adiona.git
   cd Adiona
   ```

3. Configure upstream remote to keep your fork updated:
   ```bash
   git fetch origin
   git remote add upstream https://github.com/Vijajraj/Adiona.git
   git fetch upstream
   ```

---

## 3. Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Python 3.10 or higher
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - On Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - On Linux or macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database and load seed data:
   ```bash
   python load_seed_data.py
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The backend API will run at http://127.0.0.1:8000.  
Interactive Swagger documentation is available at http://127.0.0.1:8000/docs.

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend application will run at http://localhost:5173.  
Vite is pre-configured to proxy API requests (/reports, /feedback, /moderation) to the local backend running on port 8000.

---

## 4. Core Architectural Principles

When writing code for Adiona, you must strictly follow these privacy and design constraints:

### Privacy-by-Design and Grid Snapping

- Raw GPS coordinates selected by the user must never be stored directly in the database.
- Coordinates must always be snapped to ~100m grid cell centroids using snap_to_grid() before persistence.
- The public API (GET /reports/heatmap) must only expose aggregated grid cell centers, never individual user click paths or exact locations.

### Device Anonymity

- No user accounts, passwords, email addresses, phone numbers, or cookies are used for reporting.
- A client-generated anonymous UUID (device_id) is stored locally on the client only to enforce anti-spam limits (maximum 5 reports per device per day, 24-hour cooldown per grid cell).
- The device_id must NEVER be exposed in public API response schemas.

### Category Separation

- Safety categories are strictly segregated between General Safety (e.g., poor lighting, road hazards, stray animals) and Women's Safety (e.g., harassment, stalking, unsafe transport stops).
- Do not mix or collapse these categories without discussion.

---

## 5. Contribution Workflow

### Branch Naming Conventions

Create a new branch from main using descriptive prefixes:

- feat/feature-name for new features
- fix/bug-description for bug fixes
- docs/topic-name for documentation updates
- refactor/scope for code refactoring
- test/test-scope for adding or updating tests

Example:
```bash
git checkout -b fix/mobile-modal-layout
```

### Making Changes

- Keep your changes focused. Avoid bundling unrelated fixes into a single pull request.
- Ensure all new features or bug fixes include corresponding unit or integration tests.
- Maintain backwards compatibility for existing API endpoints and schemas.

### Testing Requirements

Before pushing changes, run all test suites and ensure all tests pass:

1. Run frontend tests:
   ```bash
   cd frontend
   npx vitest run
   ```

2. Run backend tests:
   ```bash
   cd backend
   pytest tests/ -v
   ```

3. Run the production build check:
   ```bash
   cd frontend
   npm run build
   ```

Pull requests with failing tests or broken builds will not be merged.

### Submitting a Pull Request

1. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "fix: resolve touch target overflow on mobile header"
   ```

2. Push your branch to your fork:
   ```bash
   git push origin fix/mobile-modal-layout
   ```

3. Open a Pull Request against the main branch of Vijajraj/Adiona.

4. In your Pull Request description, include:
   - What problem this PR solves.
   - Summary of changes made.
   - How you tested the changes.
   - Any relevant issue numbers (e.g., Closes #12).

---

## 6. Issue Reporting and Feature Requests

If you find a bug or have an idea for an improvement:

- Check existing issues and discussions to avoid duplicates.
- Open a GitHub Issue using a clear title.
- For bug reports, provide steps to reproduce, expected behavior, actual behavior, and details about your operating system and browser.
- For feature requests, explain the rationale, the civic safety impact, and potential implementation approach.

---

## 7. Style Guides

### Python Backend Guidelines

- Follow PEP 8 standards.
- Use explicit type annotations for function signatures and Pydantic models.
- Handle asynchronous operations properly using async / await and SQLAlchemy's AsyncSession.
- All database mutations must be transaction-safe and handle potential race conditions gracefully.
- Keep dependencies minimal. Consult maintainers before adding new third-party libraries to requirements.txt.

### JavaScript and React Frontend Guidelines

- Use functional components with React Hooks.
- Ensure all interactive elements are accessible via keyboard navigation (Tab, Enter, Space, Escape).
- Follow WCAG 2.1 AA accessibility guidelines, including proper aria-* attributes and color contrast ratios.
- All Web Worker scripts must be compatible with Vite's worker pipeline (?worker&url) to ensure cross-device mobile compatibility.

### CSS and Responsive Design Guidelines

- Write clean, mobile-first CSS without hardcoded viewport assumptions.
- Support viewports from 320px (small phones) up to 4K desktop displays.
- Account for safe area insets on mobile devices using env(safe-area-inset-*).
- Ensure touch targets meet the minimum recommended size of 34px by 34px.
- Maintain full compatibility with both Light and Dark themes.
