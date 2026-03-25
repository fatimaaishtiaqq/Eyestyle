# Vercel Environment Variables Checklist

## Frontend project (luxury-ecommerce-frontend.vercel.app)

| Variable        | Required | Value                                      | Notes                                                                 |
|----------------|----------|--------------------------------------------|-----------------------------------------------------------------------|
| `VITE_API_URL` | **Yes**  | `https://luxury-ecommerce-snowy.vercel.app` | Backend API base URL. No trailing slash. Must redeploy after adding. |

**Important:** Vite injects `VITE_*` variables at **build time**. After adding or changing `VITE_API_URL`, you must trigger a new deployment.

---

## Backend project (luxury-ecommerce-snowy.vercel.app)

| Variable                 | Required | Example / Notes                                      |
|--------------------------|----------|------------------------------------------------------|
| `MONGO_URI`              | **Yes**  | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET`             | **Yes**  | Any long random string (e.g. 32+ chars)             |
| `NODE_ENV`               | Optional | `production`                                         |
| `CLOUDINARY_CLOUD_NAME`  | Optional | Only if using image uploads                          |
| `CLOUDINARY_API_KEY`     | Optional | Only if using image uploads                          |
| `CLOUDINARY_API_SECRET`  | Optional | Only if using image uploads                          |

---

## Frontend Vercel project settings to verify

- **Root Directory:** `frontend` (so the build runs from the `frontend/` folder)
- **Build Command:** `npm run build` or `vite build` (default from package.json)
- **Output Directory:** `dist`

## How to find the exact error (blank screen)

1. Open https://luxury-ecommerce-frontend.vercel.app/
2. Press **F12** (or right‑click → Inspect)
3. Go to the **Console** tab
4. Refresh the page

Look for red error messages. Common ones:

- `Failed to fetch` / `404` → API URL wrong or backend unreachable
- `JSON.parse` → Corrupted localStorage (e.g. `lux_cart`, `lux_user`, `lux_wishlist`)
- `Cannot read property 'X' of undefined` → Runtime error in a component
- `Failed to load module` → Script path wrong (404 on JS file)
