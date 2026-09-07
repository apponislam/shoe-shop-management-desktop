# Shoe Shop Management System (Offline Desktop App) 👞

A modern, fast, and feature-rich offline desktop application designed for retail shoe stores. Built with **React 19**, **TypeScript**, **Tailwind CSS**, **Electron**, and **SQLite (Prisma)**.

---

## 🌟 Key Features

* **Light Mode Interface**: Modern slate-based clean UI designed for maximum readability during store operations.
* **POS Terminal**: Fast point-of-sale terminal with real-time total calculations, size/color variant tracking, dynamic receipt previews, and quick customer creation modal.
* **Product Catalog**: Manage shoes, categories, brands, variants (sizes & colors), purchase costs, selling prices, and image URLs.
* **Stock & Inventory**: Real-time stock counts, stock alert warnings, batch updates, and size distribution.
* **Customer Directory**: Manage customer phone numbers, addresses, purchase history, and quick customer selection.
* **Offline Database**: Local SQLite database stored securely in user app data path (`app.getPath("userData")`) to ensure zero data loss across restarts or builds.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
* **Desktop Wrapper**: Electron 44, tsup
* **Database & ORM**: SQLite (`better-sqlite3`), Prisma ORM
* **Build Tools**: Vite 8, `electron-builder` / `electron-packager`

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` or `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/apponislam/shoe-shop-management-desktop.git
   cd shoe-shop-management-desktop
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   Generate Prisma client:
   ```bash
   npx prisma generate
   ```

---

## 💻 Development & Running Locally

To launch the app in **Electron development mode** with hot-module reload (HMR):

```bash
npm run dev
```

This single command concurrently runs:
1. Vite dev server (`http://localhost:5173`)
2. Electron main process bundler (`tsup`)
3. Electron window launcher

---

## 📦 Building & Packaging

To create a standalone executable for production:

* **Build Web & Electron Assets**:
  ```bash
  npm run build
  ```

* **Package Unpacked Executable**:
  ```bash
  npm run pack
  ```

* **Build Complete Windows Installer (.exe)**:
  ```bash
  npm run dist
  ```
  *Outputs will be placed inside the ignored `release/` directory.*

---

## 📂 Project Structure

```
shoe-shop-management-offline/
├── electron/                 # Electron main & IPC process files
│   ├── db.ts                 # SQLite persistent database initialization
│   ├── main.ts               # Electron window lifecycle
│   ├── preload.ts            # Secure contextBridge API bindings
│   └── services/             # Backend service logic (Sales, Products, Customers)
├── prisma/                   # Database schema & migrations
│   └── schema.prisma
├── src/                      # Frontend React Application
│   ├── components/           # Sidebar Navigation & Modals
│   ├── pages/                # POS, Dashboard, Products, Stock, Customers, Reports
│   ├── utils/                # Mock API fallbacks for browser testing
│   └── index.css             # Tailwind base styles & color tokens
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).


