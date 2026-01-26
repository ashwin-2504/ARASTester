<div align="center">

# ARASTester

### The Modern, Automated Functional Testing Suite for ARAS Innovator

![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)
![Version](https://img.shields.io/badge/version-1.0.0-green)

<br />

![ARASTester Dashboard Preview](IMAGES/DASHBOARD.png)

<br />

**[Report Bug](https://github.com/ashwin-2504/arastester/issues)** · **[Request Feature](https://github.com/ashwin-2504/arastester/issues)**

</div>

---

## 🚀 Why ARASTester?

Manual testing of ARAS PLM configurations is tedious, repetitive, and prone to human error. **ARASTester** changes the game.

Designed specifically for **ARAS PLM Testers** and **Configuration Developers**, this tool empowers you to build, organize, and execute complex test scenarios without writing a single line of code. Whether you're validating a new lifecycle map, checking permission models, or ensuring data integrity, ARASTester streamlines your workflow so you can focus on quality, not clicking.

## ✨ Key Features

### 🖱️ Visual Test Builder

Forget complex scripting. Build your test plans using a modern, intuitive **drag-and-drop interface**. Reorder tests, group actions, and modify parameters visually.

### 📂 Hierarchical Organization

Manage hundreds of test cases with ease. Our **nested test tree** allows you to structure your validation logic logically, just like your PLM data model.

### ⚡ Native Performance

Built on **Electron** and **React**, ARASTester delivers a native desktop experience. It's fast, responsive, and integrates seamlessly with your Windows environment.

### 🔒 Privacy First & Local Storage

Your data is yours. ARASTester stores all test plans as local **JSON files**. No cloud uploads, no external servers. You have full control over your testing IP.

### 🛠️ Extensible Action Registry

Need to click a button? Verify a field? Run a server method? Our **Action Registry** comes pre-loaded with essential ARAS interactions, and it's designed to grow with your needs.

### 💾 Session Profiles (New!)

Save and manage multiple ARAS connection profiles. Link specific profiles to individual tests to automatically switch sessions during execution, ensuring your tests run in the correct environment every time.
_(Note: Profiles are saved configurations. They become active ONLY when you Connect or run a test using them.)_

## 🎯 Built for ARAS Professionals

- **For QA Teams**: Reduce regression testing time from days to minutes. Ensure consistent validation across every release.
- **For Developers**: Verify your configuration changes instantly. Share test plan JSON files with your team for version-controlled validation.

## 🏁 Getting Started

### Prerequisites

- Windows 10/11
- Node.js (for development)
  > [!NOTE]
  > This project uses Node.js only. Bun is no longer required or supported.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/arastester.git
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Run the application**
    ```bash
    npm run dev
    ```

### Development Workflow

**Frontend Dev (Fast)**

- Uses Vite for faster builds and hot reload

```bash
npm run dev:server
```

**Electron Dev**

- Uses Node.js for main process

```bash
npm run dev:electron
```

**Full App Dev**

- Starts both Backend and Electronics

```bash
npm run dev
```

## 💻 Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Radix UI
- **Backend**: ASP.NET Core (.NET 8), Aras.IOM SDK
- **Desktop**: Electron
- **State Management**: Zustand, Local JSON Storage

---

## 📚 Documentation

For detailed technical documentation, see the [documentation](documentation/01_SYSTEM_OVERVIEW.md) folder:

- [System Overview](documentation/01_SYSTEM_OVERVIEW.md)
- [Architecture](documentation/02_ARCHITECTURE.md) - includes Mermaid diagram
- [Data & Control Flow](documentation/03_DATA_AND_CONTROL_FLOW.md)
- [Frontend Details](documentation/04_FRONTEND.md)
- [Backend Details](documentation/05_BACKEND.md)
- [Security & Failures](documentation/06_SECURITY_AND_FAILURES.md)
- [Non-Goals & Gaps](documentation/07_NON_GOALS_AND_GAPS.md)
- [API Reference](documentation/API_REFERENCE.md) - request/response examples

### ARAS IOM Reference

- [ARAS IOM Operations Reference](docs/ARAS_IOM_OPERATIONS.md) - Implementation status and IOM patterns
- [Aras IOM SDK - Programmer's Guide](docs/Aras%20IOM%20SDK%20-%20Programmer's%20Guide.txt) - Official SDK documentation

---
