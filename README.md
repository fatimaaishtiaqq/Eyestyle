# L'ÉLÉGANCE LINEN - Luxury Fashion E-Commerce

A full-stack MERN (MongoDB, Express, React, Node.js) luxury fashion e-commerce application designed with a premium, minimalist aesthetic inspired by high-end textile brands.

## Features
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB with Mongoose.
- **Authentication**: JWT-based secure login and registration.
- **Design System**: 
  - Typography: Playfair Display (Serif) & Inter (Sans).
  - Colors: White (#FFFFFF), Deep Gray (#333333), Soft Gold (#D4AF37), and Neutral/Off-White (#F8F8F8).
- **Core Pages**: Home (Hero & Featured), Collections (Dynamic Filtering), Product Details, Cart, Secure Checkout, Auth, About Us, Order History.
- **Micro-Interactions**: Hover zoom effects, clean transitions, and layout animations via Framer Motion.
- **Responsive**: Mobile-first design with a custom hamburger menu.

## Project Structure
```text
luxury-ecommerce/
  ├── frontend/       (Vite React Frontend)
  │   ├── src/
  │   │   ├── components/ (Navbar, Footer, ProductCard)
  │   │   ├── pages/      (Home, Collection, ProductDetails, Cart, Auth, etc)
  │   │   ├── App.jsx
  │   │   └── main.jsx
  │   ├── tailwind.config.js
  │   └── vite.config.js
  └── backend/        (Express API)
      ├── config/     (Database)
      ├── data/       (Seed data)
      ├── middleware/ (Auth & Error handlers)
      ├── models/     (User, Product, Order)
      ├── routes/     (API endpoints)
      ├── server.js   (Entry point)
      └── seeder.js   (DB Seeding script)
```

## Setup Instructions

### 1. Prerequisites
- Node.js installed on your machine.
- MongoDB running locally or a MongoDB Atlas URI.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   Rename `.env.example` to `.env` or create a new `.env` file with the following:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/luxury-ecommerce
   JWT_SECRET=supersecretkey
   NODE_ENV=development
   ```
4. Seed the Database:
   ```bash
   npm run data:import
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:5173` in your browser.

## Admin Access
When you run the database seeder (`npm run data:import`), it automatically creates an Admin account:
- **Email**: `admin@example.com`
- **Password**: `123456`
