# RHM - Rental House Management

A self-hosted web application for managing rental houses in Tamil Nadu, India. Single admin user with authentication, responsive design for mobile access.

## Features

- **House Management**: Add, edit, and track rental houses with details like rent amount, EB service number, motor service number
- **Tenant Management**: Track current and past tenants with move-in/move-out dates, advance payments
- **Rent Collection**: Record partial/full payments, track pending amounts, overdue notifications
- **Expense Tracking**: EB bills, house tax, motor bills, water bills with automatic splitting
- **Bill Splitting**: Motor bills auto-split by service number, water bills split among selected houses
- **Maintenance Expenses**: Track and split maintenance costs among houses
- **Notifications**: Overdue rent alerts (7+ days after due), upcoming expense reminders
- **WhatsApp Integration**: Generate reminder messages with one click
- **PDF Reports**: Tenant reports, house reports, yearly financial summaries
- **Database Backup**: Local backup and Google Drive integration

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | SQLite with better-sqlite3 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| PDF Export | jsPDF + jspdf-autotable |
| Backup | Google Drive API |

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

1. Clone or copy the project:
```bash
cd /mnt/d/RHM_App
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment (optional):
```bash
cd ../backend
# Edit .env file to change default credentials and settings
```

### Running in Development

1. Start the backend server:
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

3. Open http://localhost:5173 in your browser

### Default Login

- **Username**: admin
- **Password**: admin123

*Change these in the `.env` file before production use*

## Production Deployment

### Build for Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The backend will serve the built frontend in production mode.

3. Start the server:
```bash
cd backend
NODE_ENV=production npm start
```

### Raspberry Pi Deployment

1. Install Node.js 18 LTS on your Raspberry Pi

2. Copy the project to the Pi

3. Install dependencies:
```bash
cd RHM_App/backend && npm install
cd ../frontend && npm install && npm run build
```

4. Use PM2 for process management:
```bash
npm install -g pm2
cd backend
pm2 start src/index.js --name rhm
pm2 save
pm2 startup
```

5. Set up Cloudflare Tunnel for remote access

## Project Structure

```
RHM_App/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── config/
│   │   │   └── db.js             # SQLite connection & schema
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js           # Login/logout
│   │   │   ├── houses.js         # House CRUD
│   │   │   ├── tenants.js        # Tenant CRUD
│   │   │   ├── payments.js       # Rent payments
│   │   │   ├── expenses.js       # Bills & taxes
│   │   │   ├── maintenance.js    # Maintenance expenses
│   │   │   ├── notifications.js  # Due date alerts
│   │   │   ├── reports.js        # PDF generation
│   │   │   └── backup.js         # Google Drive backup
│   │   └── utils/
│   │       ├── notifications.js  # Notification logic
│   │       ├── whatsapp.js       # WhatsApp link generator
│   │       └── pdfGenerator.js   # PDF report generator
│   ├── database/
│   │   └── rhm.db                # SQLite database file
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── context/              # React context
│   │   ├── hooks/                # Custom hooks
│   │   └── utils/                # Utilities
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Houses
- `GET /api/houses` - List all houses
- `GET /api/houses/:id` - Get house details
- `POST /api/houses` - Add new house
- `PUT /api/houses/:id` - Update house
- `DELETE /api/houses/:id` - Delete house

### Tenants
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Add new tenant
- `PUT /api/tenants/:id` - Update tenant
- `PUT /api/tenants/:id/move-out` - Move out tenant

### Payments
- `GET /api/payments` - List payments
- `GET /api/payments/pending` - Get pending payments
- `POST /api/payments` - Record payment
- `PUT /api/payments/:id` - Update payment

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses/eb-bill` - Add EB bill
- `POST /api/expenses/house-tax` - Add house tax
- `POST /api/expenses/motor-bill` - Add motor bill (auto-splits)
- `POST /api/expenses/water-bill` - Add water bill (select houses)
- `PUT /api/expenses/:id/pay` - Mark expense as paid

### Maintenance
- `GET /api/maintenance` - List maintenance expenses
- `POST /api/maintenance` - Add maintenance expense

### Reports
- `GET /api/reports/tenant/:id/pdf` - Tenant report PDF
- `GET /api/reports/house/:id/pdf` - House report PDF
- `GET /api/reports/yearly/:year/pdf` - Yearly report PDF

### Backup
- `POST /api/backup/local` - Create local backup
- `POST /api/backup/google-drive` - Backup to Google Drive
- `GET /api/backup/download` - Download latest backup

## Google Drive Backup Setup

1. Create a Google Cloud project
2. Enable the Google Drive API
3. Create a service account and download credentials
4. Share a Google Drive folder with the service account email
5. Add the following to `.env`:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

## Security Notes

- Change the default admin password immediately
- Update `JWT_SECRET` in `.env` for production
- The app is designed for single-user access behind authentication
- Database file should be backed up regularly
- Consider using HTTPS via Cloudflare Tunnel for remote access

## License

Private use only.
