# 🎫 MASUP.ID - Event Ticketing System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Sistem pemesanan tiket event modern untuk lari marathon, olahraga, workshop, seminar, musik, kuliner, dan charity.

## ✨ Features

### 🎯 Core Features
- ✅ Browse & search events dengan filtering
- ✅ Shopping cart system
- ✅ Checkout process dengan Virtual Account
- ✅ User authentication (Login/Register + Google OAuth)
- ✅ Guest checkout (tiket via email)
- ✅ Dashboard tiket "Tiket Saya"
- ✅ Countdown timer untuk pending payment (24 jam)
- ✅ QR Code generation untuk e-ticket
- ✅ Download/Print ticket functionality

### 🔒 Authentication System
- ✅ Email & Password login
- ✅ Google OAuth integration (mock)
- ✅ Session persistence (localStorage)
- ✅ JWT token simulation
- ✅ "Remember Me" functionality (24h vs 2h)
- ✅ Auto-logout setelah 30 menit tidak aktif
- ✅ Password strength validation
- ✅ Form validation dengan real-time feedback

### 💳 Payment Features
- ✅ Virtual Account payment method
- ✅ Pending order management
- ✅ Payment countdown timer
- ✅ Payment success modal
- ✅ Order history

### 🎨 UI/UX
- ✅ Clean & minimalist design (Tiket.com inspired)
- ✅ Sky-600 blue color scheme
- ✅ Inter font typography
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd masup-ticketing

# Build & Run dengan Docker
make build
make up

# Akses di: http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Akses di: http://localhost:5173
```

## 📚 Documentation

- **[🐳 Docker Guide](./DOCKER_GUIDE.md)** - Panduan lengkap Docker deployment
- **[🔐 Authentication Guide](./AUTHENTICATION_GUIDE.md)** - Sistem authentication & security
- **[🐳 Docker Quick Start](./DOCKER_README.md)** - Quick reference Docker commands

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **Vite 6.3.5** - Build tool & dev server
- **Tailwind CSS 4** - Styling framework
- **TypeScript** - Type safety (via JSX)

### UI Components
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **QRCode** - QR code generation

### State Management
- **React Context API** - Global state
- **localStorage** - Persistence

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Production web server
- **GitHub Actions** - CI/CD

## 📁 Project Structure

```
masup-ticketing/
├── src/
│   ├── app/
│   │   ├── components/       # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── MyTickets.tsx
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   └── EventsContext.tsx
│   │   ├── services/         # API services
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # Main app component
│   └── styles/               # Global styles
├── Dockerfile                # Production Docker config
├── Dockerfile.dev            # Development Docker config
├── docker-compose.yml        # Docker Compose config
├── nginx.conf                # Nginx configuration
├── Makefile                  # Make commands
└── package.json              # Dependencies
```

## 🐳 Docker Commands

### Using Make (Recommended)

```bash
make help              # Show all commands
make dev               # Development mode
make build             # Build production image
make up                # Start production
make down              # Stop containers
make logs              # Show logs
make clean             # Cleanup
make deploy            # Build & deploy
```

### Using npm scripts

```bash
npm run docker:build  # Build Docker image
npm run docker:up     # Start containers
npm run docker:down   # Stop containers
npm run docker:logs   # Show logs
npm run docker:dev    # Development mode
npm run docker:clean  # Cleanup
```

### Using docker-compose directly

```bash
docker-compose build                           # Build
docker-compose up -d                          # Start
docker-compose down                           # Stop
docker-compose logs -f                        # Logs
docker-compose --profile dev up masup-dev    # Dev mode
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit sesuai kebutuhan:

```env
NODE_ENV=production
VITE_API_URL=http://localhost:8000
VITE_APP_VERSION=1.0.0
```

### Demo Account

Untuk testing authentication:

```
Email: demo@masup.id
Password: demo123
```

## 📊 Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Event Browsing | ✅ Complete | With search & filter |
| Shopping Cart | ✅ Complete | Full functionality |
| Checkout | ✅ Complete | With guest checkout |
| Authentication | ✅ Complete | Email + Google OAuth (mock) |
| Payment Flow | ✅ Complete | Virtual Account with timer |
| My Tickets | ✅ Complete | QR Code + Download |
| Responsive Design | ✅ Complete | Mobile, Tablet, Desktop |
| Docker Support | ✅ Complete | Production ready |
| Backend Integration | 🔄 Mock | Ready for API integration |

## 🚧 Backend Integration

Aplikasi ini menggunakan **mock data** dan siap untuk integrasi backend. Yang perlu dilakukan:

1. Update `VITE_API_URL` di `.env`
2. Replace mock functions di `src/app/services/api.ts`
3. Update AuthContext untuk real JWT tokens
4. Setup backend API endpoints

Dokumentasi lengkap ada di [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)

## 🌐 Deployment

### Development

```bash
make dev
# or
docker-compose --profile dev up masup-dev
```

Access: http://localhost:5173

### Production

```bash
make deploy
# or
docker-compose up -d
```

Access: http://localhost:3000

### Full Stack Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Includes: Frontend + Backend + Database + Redis (commented out, uncomment when ready)

## 🧪 Testing

### Health Check

```bash
# Production
curl http://localhost:3000/health

# Development
curl http://localhost:5173
```

### Using Make

```bash
make test-health    # Test health endpoint
make test-app       # Test application
```

## 📈 Performance

- **Production Build Size**: ~2 MB (gzipped)
- **Docker Image Size**: ~50 MB (optimized)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s

## 🔐 Security

- ✅ HTTPS ready (Nginx SSL support)
- ✅ Security headers (XSS, Frame, Content-Type)
- ✅ Password validation
- ✅ Session timeout (30 minutes)
- ✅ JWT token expiry
- ✅ Input sanitization
- ✅ CORS configuration ready

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Development Team** - MASUP.ID

## 🙏 Acknowledgments

- Design inspiration: Tiket.com
- UI Components: Radix UI
- Icons: Lucide React
- Hosting: Docker + Nginx

## 📞 Support

For support, email support@masup.id or create an issue in the repository.

---

**Made with ❤️ by MASUP.ID Team**

**Version**: 1.0.0 | **Last Updated**: January 2026
