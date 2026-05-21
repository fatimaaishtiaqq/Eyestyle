# Eyestyle — Luxury Fashion E-Commerce

A full-stack MERN (MongoDB, Express, React, Node.js) luxury fashion e-commerce application designed with a premium, minimalist aesthetic inspired by high-end eyewear brands.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + Vite | React 19, Vite 8 |
| **Styling** | Tailwind CSS | v4 |
| **Animations** | GSAP, Framer Motion | GSAP 3.14, Framer 11 |
| **3D Effects** | Three.js + React Three Fiber | Three 0.166 |
| **Backend** | Node.js + Express | Express 4 |
| **Database** | MongoDB + Mongoose | Mongoose 8 |
| **Auth** | JWT + Firebase | JWT 9, Firebase 12 |
| **Payments** | Stripe | v22 |
| **Image Storage** | Cloudinary | v1 |
| **UI Components** | MUI | v7 |
| **Charts** | Recharts | v3 |

## Features
- **Storefront**: Home (Hero & Featured), Collections (Dynamic Filtering), Product Details, Cart, Secure Checkout, Wishlist, Order History.
- **Authentication**: JWT-based login/register + Google OAuth via Firebase.
- **Admin Panel**: Dashboard, Product Management, Order Management, Category Management, Sales & Discounts (Campaigns + Coupon Codes), Analytics, Reviews, Settings.
- **Sales & Discounts**: Create store-wide or product-specific markdown campaigns with expiry; create promo/coupon codes. Reuse campaign names after expiry or cancellation.
- **Animations**: GSAP scroll-triggered animations, Three.js 3D background, Framer Motion micro-interactions.
- **Responsive**: Mobile-first design with custom hamburger menu.
- **WhatsApp Bot**: Order notification integration via Baileys.

## Project Structure
```text
Eyestyle/
  ├── frontend/                 (Vite + React 19 Frontend)
  │   ├── src/
  │   │   ├── admin/pages/      (Admin Panel pages)
  │   │   ├── components/       (Navbar, Footer, ProductCard, etc.)
  │   │   ├── pages/            (Home, Collection, ProductDetails, Cart, Auth, etc.)
  │   │   ├── App.jsx
  │   │   └── main.jsx
  │   ├── .npmrc                (legacy-peer-deps for Tailwind v4 + Vite 8)
  │   └── vite.config.js
  └── backend/                  (Express API)
      ├── config/               (Database connection)
      ├── data/                 (Seed data)
      ├── middleware/           (Auth & Error handlers)
      ├── models/               (User, Product, Order, Sale, Coupon, etc.)
      ├── routes/               (API endpoints)
      ├── server.js             (Entry point)
      └── seeder.js             (DB Seeding script)
```

## Setup Instructions

### 1. Prerequisites

Make sure the following are installed **before** starting:

| Tool | Required Version | Notes |
|---|---|---|
| **Node.js** | **v20.0.0 or higher** | v20 LTS recommended — required for React 19 & Vite 8 |
| **npm** | **v10.0.0 or higher** | Comes bundled with Node 20 |
| **MongoDB** | v5+ | Running locally on `127.0.0.1:27017` or use MongoDB Atlas |
| **Git** | Any recent version | For cloning the repository |

Check your versions:
```bash
node -v    # must be v20+
npm -v     # must be v10+
```

---

### 2. Clone the Repository

```bash
git clone https://github.com/fatimaaishtiaqq/Eyestyle.git
cd Eyestyle
```

---

### 3. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file inside the `backend/` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/luxury-ecommerce
   JWT_SECRET=supersecretkey
   NODE_ENV=development
   ```

4. Seed the database:
   ```bash
   npm run data:import
   ```

5. Start the backend server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

---

### 4. Frontend Setup

1. Open a **new terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   > ⚠️ The `--legacy-peer-deps` flag is **required**. Tailwind CSS v4 has a peer dependency quirk with Vite v8 that causes `npm install` to fail without it.

3. Start the Vite dev server:
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

4. Visit `http://localhost:5173` in your browser.

---

## Admin Access

When you run the database seeder (`npm run data:import`), it automatically creates an Admin account:
- **Email**: `admin@example.com`
- **Password**: `123456`

---

## Deployment

| Service | Platform | Auto-Deploy |
|---|---|---|
| **Frontend** | Vercel | ✅ Auto-deploys on push to `main` |
| **Backend** | Render | ✅ Auto-deploys on push to `main` |
