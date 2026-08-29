# Developer Setup Guide: World Money Terminal OS

## 1. Prerequisites
- **Node.js**: `v20.0+` (LTS recommended)
- **npm**: `v10.0+`
- **Python**: `v3.10+` (for FinanceVault daemon & policy rates parsing)

---

## 2. Quick Installation

```bash
# Clone or navigate to the repository
cd World_money_updates

# Install Node dependencies
npm install
```

---

## 3. Environment Variables

Create or update `.env.local` in the project root:

```env
# FRED (Federal Reserve Bank of St. Louis) API Key
VITE_FRED_API_KEY=368567513cea25132f78361edd85116a

# Backend API Port
VITE_BACKEND_API_URL=http://127.0.0.1:8766
```

---

## 4. Running Tests

```bash
# Run JavaScript unit & regression test suite (17 tests)
npm test

# Run Python FinanceVault & policy rate tests (13 tests)
python3 -m unittest discover tests
```

---

## 5. Local Development Workflow

```bash
# Terminal 1: Start Vite Frontend Server
npm run dev
# ➜  Local: http://localhost:5173/

# Terminal 2: Start Node/Python Backend Server
npm run server
# ➜  API Server live on http://127.0.0.1:8766
```

---

## 6. Building for Production

```bash
# Build optimized Vite bundle
npm run build

# Preview production build locally
npm run preview
```
