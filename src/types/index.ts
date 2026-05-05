// ─── User ─────────────────────────────────────────────────────────────────────

export type { User } from './user/user'

// ─── Bus Company ──────────────────────────────────────────────────────────────

export interface BusCompany {
    id: string
    name: string
    phone: string
    email: string
    address: string
    serviceFee: number // percentage
    logoUrl?: string
    status: 'active' | 'locked'
    isActive: boolean
    createdAt: string
}

// ─── Bus ──────────────────────────────────────────────────────────────────────

export type BusType = 'seat' | 'sleeper' | 'vip'

export interface Bus {
    id: string
    companyId: string
    plateNumber: string
    name: string
    busCode?: string
    description?: string
    totalSeats: number
    type: BusType
    isActive: boolean
    createdAt?: string
}

// ─── Bus Version ──────────────────────────────────────────────────────────────

export interface BusVersion {
    id: string
    busId: string
    versionNo: number
    driverPhone?: string
    status: string
    createdAt: string
}

// ─── Location & Geography ─────────────────────────────────────────────────────

export interface Province {
    id: string
    name: string
    code: string
    divisionType?: string
}

export interface Ward {
    id: string
    provinceId: string
    name: string
    code: string
    divisionType?: string
}

export interface Location {
    id: string
    name: string
    address?: string
    wardId?: string
    provinceId: string
    latitude?: number
    longitude?: number
    isActive: boolean
    createdAt: string
}

// ─── Route (Itinerary) ────────────────────────────────────────────────────────

export interface RouteItinerary {
    id: string
    from: string
    to: string
    fromLocationId?: string
    toLocationId?: string
    distanceKm: number
    estimatedMinutes: number
}

// ─── Trip ─────────────────────────────────────────────────────────────────────

export type TripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'

export interface Trip {
    id: string
    companyId: string
    routeId: string
    busId: string
    busVersionId?: string
    departureTime: string // ISO string
    arrivalTime: string   // ISO string
    pricePerSeat: number  // VND (base_price)
    availableSeats: number
    status: TripStatus
    isPublished?: boolean
    cancelReason?: string
    createdAt?: string
}

// ─── Trip Pickup / Dropoff Points ─────────────────────────────────────────────

export interface TripPickupPoint {
    id: string
    tripId: string
    locationId: string
    pickupTime: string
    note?: string
    location?: Location
}

export interface TripDropoffPoint {
    id: string
    tripId: string
    locationId: string
    dropoffTime: string
    note?: string
    location?: Location
}

// ─── Seat Layout ──────────────────────────────────────────────────────────────

export interface SeatLayout {
    id: string
    companyId: string
    name: string
    rows: number
    columns: number
    createdAt: string
}

export interface Seat {
    id: string
    layoutId: string
    seatCode: string
    row: number
    col: number
    floor: number
    seatType: string
    price: number
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export type BookingStatus =
    | 'pending_payment'
    | 'reserved'
    | 'confirmed'
    | 'cancelled'
    | 'expired'
    | 'completed'

export type PaymentMethod = 'online' | 'pay_on_board'

export interface Booking {
    id: string
    bookingCode: string
    userId: string
    tripId: string
    totalAmount: number
    paymentMethod: PaymentMethod
    status: BookingStatus
    expiresAt?: string
    createdAt: string
}

export interface BookingSeat {
    id: string
    bookingId: string
    seatId: string
    price: number
}

// ─── Ticket (kept for backward compatibility with mock) ───────────────────────

export type TicketStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Ticket {
    id: string
    tripId: string
    customerId: string
    seatNumbers: string[]
    totalPrice: number
    status: TicketStatus
    passengerName: string
    passengerPhone: string
    note?: string
    createdAt: string
    expiresAt?: string
    pickupPointId?: string
    pickupPointName?: string
    dropoffPointId?: string
    dropoffPointName?: string
    paymentMethod?: PaymentMethod
    paymentProvider?: PaymentProvider
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'confirmed_on_board'
export type PaymentType = 'online' | 'pay_on_board'
export type PaymentProvider = 'vnpay' | 'momo' | 'stripe'

export interface Payment {
    id: string
    bookingId: string
    paymentType: PaymentType
    provider?: PaymentProvider
    method?: string // qr | atm | credit_card | cash | pos
    amount: number
    status: PaymentStatus
    transactionCode?: string
    createdAt: string
    completedAt?: string
}

// ─── Revenue & Settlement ─────────────────────────────────────────────────────

export interface Revenue {
    id: string
    companyId: string
    bookingId: string
    grossAmount: number
    commission: number
    netAmount: number
    paymentType: PaymentType
    createdAt: string
}

export interface Settlement {
    id: string
    companyId: string
    periodFrom: string
    periodTo: string
    totalGross: number
    totalCommission: number
    totalNet: number
    status: 'pending' | 'paid'
    createdAt: string
}

// ─── Trip Stop (simplified pickup/dropoff for UI) ─────────────────────────────

export interface TripStop {
    id: string
    tripId: string
    name: string
    address: string
    time: string // ISO
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface TripSearchParams {
    from: string
    to: string
    date: string // YYYY-MM-DD
    passengers?: number
    returnDate?: string  // for round-trip
}

export interface TripWithDetails extends Trip {
    company: BusCompany
    route: RouteItinerary
    bus: Bus
    pickupPoints: TripStop[]
    dropoffPoints: TripStop[]
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AdminStats {
    totalUsers: number
    totalCompanies: number
    totalTrips: number
    totalTickets: number
    totalRevenueVnd: number
}

export interface CompanyStats {
    totalBuses: number
    totalTrips: number
    totalBookings: number
    revenueVnd: number
    upcomingTrips: number
}
