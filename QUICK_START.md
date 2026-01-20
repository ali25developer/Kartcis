# 🚀 KARTCIS.ID - Quick Start Guide

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Docker

```bash
# Development
make dev

# Production
make build
make up

# View logs
make logs
```

## Routes

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | HomePage | No | Browse all events |
| `/event/:eventId` | EventDetailPage | No | View event details & select tickets |
| `/checkout` | CheckoutPage | No | Enter buyer info & confirm |
| `/payment/:orderId` | PaymentPage | No | View Virtual Account & pay |
| `/payment/success/:orderId` | PaymentSuccessPage | No | Payment confirmation |
| `/my-tickets` | MyTicketsPage | **Yes** | View purchased tickets |

## User Flow

### Guest Purchase (No Login):
```
Browse Events → Select Event → Choose Tickets → 
Enter Email/Phone → Get Virtual Account → 
Pay → Receive Ticket via Email
```

### Authenticated Purchase:
```
Login → Browse Events → Select Event → Choose Tickets → 
Auto-filled Info → Get Virtual Account → 
Pay → View in "Tiket Saya" Dashboard
```

## Key Features

- ✅ **Direct Checkout** - No cart, faster purchase
- ✅ **URL-Based Navigation** - Shareable event links
- ✅ **Guest Checkout** - Buy without account
- ✅ **Virtual Account Payment** - BCA VA with 24h countdown
- ✅ **Persistent Orders** - localStorage tracking
- ✅ **Responsive Design** - Mobile & desktop optimized
- ✅ **Search & Filter** - Find events easily

## Tech Stack

- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **React Router 7.12** - Routing
- **Tailwind CSS 4** - Styling
- **Vite 6.3** - Build tool
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## State Management

- **AuthContext** - User authentication
- **EventsContext** - Events data
- **localStorage** - Pending orders & tickets
- **React Router** - Navigation state

## Important Notes

⚠️ **No Cart System** - Users purchase one event at a time
✅ **JWT Simulation** - Auth uses localStorage (demo only)
✅ **Mock API** - Static data from `/src/app/data/events.ts`
✅ **Production Ready** - Dockerized with Nginx

## Deployment

```bash
# Build Docker image
docker build -t kartcis-frontend .

# Run container
docker run -p 3000:80 kartcis-frontend

# Access at http://localhost:3000
```

## Environment

No environment variables needed - fully static frontend with mock data.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- ⚡ Fast initial load
- 📦 Code splitting by route
- 🎨 Tailwind CSS purging
- 🖼️ Lazy loaded images
- ⏱️ Optimized bundle size
