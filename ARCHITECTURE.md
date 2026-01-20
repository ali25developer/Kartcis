# 🏗️ KARTCIS.ID - Architecture Overview

## Application Structure

```
KARTCIS.ID
│
├── Frontend (React + TypeScript)
│   ├── Routing (React Router)
│   ├── State (Context API)
│   └── Storage (localStorage)
│
└── Mock Backend (Static Data)
    └── events.ts
```

## Component Hierarchy

```
App (BrowserRouter)
 │
 ├── AuthProvider
 │   └── EventsProvider
 │       └── AppLayout
 │           │
 │           ├── Header (Sticky)
 │           │   ├── Logo → navigate('/')
 │           │   ├── Search
 │           │   ├── Login/User Menu
 │           │   └── Pending Payment Banner
 │           │
 │           ├── Routes
 │           │   ├── / → HomePage
 │           │   ├── /event/:id → EventDetailPage
 │           │   ├── /checkout → CheckoutPage
 │           │   ├── /payment/:id → PaymentPage
 │           │   ├── /payment/success/:id → PaymentSuccessPage
 │           │   └── /my-tickets → MyTicketsPage (Protected)
 │           │
 │           └── Modals
 │               ├── Login
 │               ├── Register
 │               └── Help
 │
 └── Toaster (Sonner)
```

## Page Components

### HomePage
```
┌────────────────────────────────────┐
│ Hero Banner (Carousel)             │
├────────────────────────────────────┤
│ Search Bar                         │
├────────────────────────────────────┤
│ Featured Events Slider             │
├────────────────────────────────────┤
│ Category Filters                   │
├────────────────────────────────────┤
│ Events Grid (3 columns)            │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │Event│ │Event│ │Event│           │
│ └─────┘ └─────┘ └─────┘           │
└────────────────────────────────────┘
```

### EventDetailPage
```
┌────────────────────────────────────┐
│ ← Back to Home                     │
├───────────────┬────────────────────┤
│ Event Image   │ Ticket Selection   │
│               │ ┌────────────────┐ │
│ Event Info    │ │ Ticket Type 1  │ │
│ - Date        │ │ Price: 100k    │ │
│ - Location    │ │ Qty: [- 0 +]   │ │
│ - Category    │ └────────────────┘ │
│               │ ┌────────────────┐ │
│ Description   │ │ Ticket Type 2  │ │
│               │ │ Price: 200k    │ │
│ Terms         │ │ Qty: [- 0 +]   │ │
│               │ └────────────────┘ │
│               │                    │
│               │ Total: Rp 300.000  │
│               │ [Checkout Sekarang]│
└───────────────┴────────────────────┘
```

### CheckoutPage
```
┌────────────────────────────────────┐
│ ← Back                             │
├───────────────┬────────────────────┤
│ Form          │ Order Summary      │
│ ┌───────────┐│ ┌────────────────┐ │
│ │ Name      ││ │ Event Image    │ │
│ │ Email     ││ │ Event Title    │ │
│ │ Phone     ││ │ Date & Location│ │
│ └───────────┘│ │                │ │
│              │ │ Tickets:       │ │
│ [Lanjut Bayar]│ │ - Type A x 2   │ │
│              │ │ - Type B x 1   │ │
│              │ │                │ │
│              │ │ Total: 300k    │ │
│              │ └────────────────┘ │
└───────────────┴────────────────────┘
```

### PaymentPage
```
┌────────────────────────────────────┐
│ Virtual Account Details            │
├────────────────────────────────────┤
│ ⏱ Waktu: 23j 45m                   │
├────────────────────────────────────┤
│ Bank: BCA                          │
│ VA Number: 8810123456789012        │
│ [Copy]                             │
├────────────────────────────────────┤
│ Amount: Rp 300.000                 │
├────────────────────────────────────┤
│ How to Pay:                        │
│ 1. Open BCA Mobile/ATM             │
│ 2. Select Transfer                 │
│ 3. Enter VA Number                 │
│ 4. Confirm Payment                 │
├────────────────────────────────────┤
│ [✓ Saya Sudah Bayar]               │
│ [Cancel]                           │
└────────────────────────────────────┘
```

## Data Flow

### Event Selection
```
HomePage
  │
  ├─ User clicks EventCard
  │
  ├─ navigate(`/event/${eventId}`)
  │
  └─ EventDetailPage loads event from static data
```

### Checkout Flow
```
EventDetailPage
  │
  ├─ User selects tickets (local state)
  │   selectedTickets = { ticketId: quantity }
  │
  ├─ navigate('/checkout', { state: { event, selectedTickets } })
  │
  └─ CheckoutPage
       │
       ├─ User fills form
       │
       ├─ Create order object
       │
       ├─ Save to pendingOrderStorage (localStorage)
       │
       ├─ navigate(`/payment/${orderId}`)
       │
       └─ PaymentPage
            │
            ├─ Load order from localStorage
            │
            ├─ Show VA details
            │
            ├─ Countdown timer (24h)
            │
            ├─ User clicks "Saya Sudah Bayar"
            │
            ├─ Update order status to 'completed'
            │
            ├─ navigate(`/payment/success/${orderId}`)
            │
            └─ PaymentSuccessPage
                 │
                 └─ Show success + download ticket button
```

## State Management

### Global Context

```typescript
// AuthContext
{
  isAuthenticated: boolean
  user: { name, email } | null
  login: (credentials) => Promise<void>
  logout: () => void
}

// EventsContext (if needed for future API)
{
  events: Event[]
  categories: string[]
  loading: boolean
}
```

### Local State (Component-Level)

```typescript
// EventDetailPage
{
  event: Event | null
  selectedTickets: Record<string, number>
}

// CheckoutPage
{
  formData: { name, email, phone }
  loading: boolean
}

// PaymentPage
{
  pendingOrder: PendingOrder | null
  timeLeft: number
}
```

### Persistent Storage (localStorage)

```typescript
// Keys
{
  'kartcis_pending_orders': PendingOrder[]
  'kartcis_auth_token': string
  'kartcis_auth_user': User
  'kartcis_purchased_tickets': PurchasedTicket[]
}
```

## Security Notes

⚠️ **Current Implementation (Demo):**
- JWT stored in localStorage
- No real backend validation
- Mock authentication

✅ **Production Recommendations:**
- Use httpOnly cookies for tokens
- Implement real backend API
- Add CSRF protection
- Use secure payment gateway
- Encrypt sensitive data

## Performance Optimizations

### Code Splitting
```
Route-based splitting:
- HomePage.tsx (loaded on /)
- EventDetailPage.tsx (loaded on /event/:id)
- CheckoutPage.tsx (loaded on /checkout)
- etc.
```

### Lazy Loading
```typescript
// Future optimization
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
```

### Memoization
```typescript
// Used in HomePage for filtered events
const filteredEvents = useMemo(() => {
  // Filter logic
}, [events, category, searchQuery])
```

## Routing Strategy

### Public Routes
- `/` - Anyone can view events
- `/event/:id` - Anyone can view details
- `/checkout` - Anyone can checkout
- `/payment/:id` - Anyone can pay

### Protected Routes
- `/my-tickets` - Requires authentication
  - If not logged in → Show login modal
  - If logged in → Show tickets

### Route Guards
```typescript
<Route 
  path="/my-tickets" 
  element={
    <ProtectedRoute>
      <MyTicketsPage />
    </ProtectedRoute>
  } 
/>
```

## Error Handling

### Not Found Event
```
User → /event/invalid-id
  ↓
EventDetailPage checks event exists
  ↓
If not found → toast.error() + navigate('/')
```

### Expired Order
```
User → /payment/expired-order-id
  ↓
PaymentPage checks order status
  ↓
If expired → toast.error() + navigate('/')
```

### Invalid Checkout
```
User → /checkout (without state)
  ↓
CheckoutPage checks location.state
  ↓
If no state → toast.error() + navigate('/')
```

## Future Enhancements

### Planned Features
- [ ] Real backend API integration
- [ ] Payment gateway integration
- [ ] Email service for tickets
- [ ] QR code scanning
- [ ] Event calendar view
- [ ] Wishlist/favorites
- [ ] Event recommendations
- [ ] Social sharing
- [ ] Reviews & ratings
- [ ] Multi-language support

### Technical Debt
- [ ] Add proper error boundaries
- [ ] Implement loading skeletons
- [ ] Add analytics tracking
- [ ] Improve accessibility (ARIA)
- [ ] Add E2E tests
- [ ] Optimize images (WebP, lazy load)
- [ ] Add service worker (PWA)
