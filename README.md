# Annada Pure Veg 🌿

> **100% Pure Vegetarian** Breakfast & Tiffin Service  
> Anand Park Bus Stop, near Sancheti Classes, Wadgaon Sheri, Pune - 411014

A full-stack production web application for Annada Pure Veg restaurant — featuring online ordering, tiffin subscriptions, Razorpay payments, and a complete admin panel.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt (httpOnly cookies) |
| Payments | Razorpay (UPI, Cards, Net Banking, COD) |
| Images | Cloudinary |
| State | Zustand (cart) + React Query (data) |
| Charts | Recharts |

---

## 📁 Project Structure

```
annada-pure-veg/
├── backend/                  # Node.js + Express API
│   ├── config/               # DB, Cloudinary, Razorpay setup
│   ├── middleware/            # Auth, rate limiting, error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route handlers
│   ├── server.js             # Express app entry
│   └── seed.js               # Database seed script
└── frontend/                 # Next.js 14 App
    ├── app/                  # App Router pages
    ├── components/           # Reusable components
    ├── lib/                  # API client, utils
    ├── store/                # Zustand stores
    └── public/               # Static assets + PWA manifest
```

---

## ⚙️ Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)
- Razorpay account (test mode)

---

## 🔧 Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret string (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
| `CLIENT_URL` | Frontend URL (http://localhost:3000 in dev) |

### 3. Seed the database
```bash
npm run seed
```

This creates:
- ✅ 1 admin user (`admin@annadapureveg.com` / `Admin@123`)
- ✅ 21 menu items across all categories
- ✅ Store settings (name, address, timings, delivery areas)
- ✅ 3 sample coupon codes: `WELCOME10`, `SAVE20`, `TIFFIN50`

### 4. Start the backend
```bash
npm run dev      # Development (with nodemon)
npm start        # Production
```

API will be available at: `http://localhost:5000`

Health check: `GET http://localhost:5000/health`

---

## 🎨 Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (http://localhost:5000/api) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key |

### 3. Start the frontend
```bash
npm run dev
```

App will be available at: `http://localhost:3000`

---

## 👤 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@annadapureveg.com | Admin@123 |

Admin panel: `http://localhost:3000/admin`

---

## 🧪 Coupon Codes (Seed Data)

| Code | Discount | Minimum Order |
|------|----------|--------------|
| `WELCOME10` | 10% off | ₹100 |
| `SAVE20` | ₹20 flat | ₹150 |
| `TIFFIN50` | ₹50 off tiffin | ₹300 |

---

## 📦 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu/items` | All menu items |
| GET | `/api/menu/items?category=Poha` | Filtered items |
| GET | `/api/settings` | Store info & timings |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |

### Authenticated (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order |
| GET | `/api/orders/my` | My orders |
| GET | `/api/orders/:id` | Order detail |
| POST | `/api/tiffin/subscribe` | Subscribe to tiffin |
| GET | `/api/tiffin/my` | My subscriptions |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/orders` | All orders |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/menu/items` | Add menu item |
| PUT | `/api/menu/items/:id` | Edit menu item |
| GET | `/api/customers` | All customers |

---

## 🚀 Deployment

### Backend → Railway / Render
1. Push backend to GitHub
2. Create new service on Railway/Render
3. Add all env variables
4. Deploy

### Frontend → Vercel
1. Push frontend to GitHub
2. Import to Vercel
3. Add env variables
4. Deploy

---

## 📱 PWA Support
The app supports "Add to Home Screen" and offline menu viewing. The service worker caches the menu page for offline access.

---

## 🌿 All Items are Pure Vegetarian
Annada Pure Veg serves only 100% vegetarian food. All menu items are marked with a 🌿 Pure Veg badge.

---

## 📞 Support
- WhatsApp: [Store WhatsApp Number]
- Email: info@annadapureveg.com
