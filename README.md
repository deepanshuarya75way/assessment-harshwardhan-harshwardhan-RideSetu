# RideSetu

**One Place. Every Ride. Every Destination.**

RideSetu is a travel mobility platform connecting tourists and travelers with verified local vehicle rental operators across Uttarakhand (Rishikesh, Mussoorie, Dehradun, Haridwar, Nainital, and Haldwani). It simplifies discovering, comparing, and booking rental scooters, motorcycles, EVs, and self-drive cars with transparent pricing, instant booking confirmation, and digital trip management.

---

## Features

### 👤 Customer Experience
- **Vehicle Search & Discovery**: Filter rental options by city, location hub, vehicle category, and date-time slots.
- **Side-by-Side Comparison**: Compare up to 4 vehicles simultaneously across daily rates, deposits, KM limits, and amenities.
- **Transparent Checkout**: Clear breakdown of rental fare, delivery charges, platform fee, GST, and refundable security deposit.
- **Rider Verification & Profile**: Secure driving license and KYC document upload with encrypted storage and Smart Rider auto-fill.
- **Active Ride Companion**: Real-time trip dashboard, 24/7 roadside assistance hotline, and digital handover inspection certificates.
- **Flexible Cancellations & Extensions**: Automated tier-based cancellation refunds and seamless rental duration extensions.

### 🏢 Vendor & Fleet Operations
- **Vendor Portal**: Business onboarding, operating hours, delivery radius, and fleet listing management.
- **Availability Guard**: Visual schedule management with conflict prevention over existing customer bookings.
- **Digital Handover Tool**: Pre-ride 360° photo capture, fuel/odometer recording, and condition documentation.
- **Financial Ledger**: Automated revenue tracking, platform commission deductions, and payout history.

### 🛡️ Administrative Oversight
- **KYC & Fleet Approvals**: Admin verification for customer identity documents and vendor vehicle listings.
- **Dispute Resolution**: Impartial arbitration for damage disputes and deposit escrows based on digital inspection records.
- **Platform Analytics**: Real-time marketplace metrics, volume, active fleet counts, and transaction logs.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT + bcryptjs (Role-based: Customer, Vendor, Admin)
- **Security**: AES-256-GCM field encryption & HMAC-SHA256 URL signing
- **Integrations**: Razorpay Payment Gateway, Google Maps API

---

## Project Structure

```
src/
├── app/                  # Next.js 14 App Router (pages & API routes)
│   ├── api/              # Serverless REST endpoints
│   ├── dashboard/        # Customer trip management & profile
│   ├── partner/          # Vendor fleet management & earnings portal
│   └── ops/              # Admin operations console
├── components/           # Reusable UI components (maps, booking, common)
├── lib/                  # Database connections, encryption & helper utils
├── models/               # Mongoose database schemas & models
├── services/             # Core business logic engines
└── scripts/              # Automated regression test suites
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9+
- MongoDB instance (local or MongoDB Atlas)

### Setup & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshqu/RideSetu.git
   cd RideSetu
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and provide required credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

The project requires the following environment variables (defined in `.env.local`):

- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - Secret key for token signing
- `ENCRYPTION_KEY` - 32-byte hex key for data encryption
- `RAZORPAY_KEY_ID` - Razorpay gateway Key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API client key

---

## Development Notes & Testing

Development mode includes built-in test features and mock services for local evaluation:

- **Master OTP**: Use `123456` for instant phone verification in development mode.
- **Demo Accounts**:
  - Customer: `customer@ridesetu.demo` / `customer123`
  - Vendor: `vendor@ridesetu.demo` / `vendor123`
  - Admin: `admin@ridesetu.demo` / `admin123`

### Automated Regression Testing

```bash
# Run test suites
npm run test:e2e
npm run lint
npm run build
```

---

## License

© 2026 RideSetu. All rights reserved.
