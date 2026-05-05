import type {
    BusCompany,
    Bus,
    RouteItinerary,
    Trip,
    Ticket,
    TripStop,
} from '@/types'
import type { User } from 'types/user/user'

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
    {
        id: 'u1',
        name: 'Admin Hệ Thống',
        username: 'admin',
        email: 'admin@vexe.vn',
        password: 'admin123',
        role: 'admin',
        phone: '0900000001',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
        id: 'u2',
        name: 'Trần Văn Tuấn',
        username: 'tuanphuong',
        email: 'tuanphuong@vexe.vn',
        password: 'company123',
        role: 'bus_company',
        companyId: 'c1',
        phone: '0900000002',
        isActive: true,
        createdAt: '2024-01-05T00:00:00.000Z',
    },
    {
        id: 'u3',
        name: 'Lê Thị Hoa',
        username: 'hoathanh',
        email: 'hoathanh@vexe.vn',
        password: 'company123',
        role: 'bus_company',
        companyId: 'c2',
        phone: '0900000003',
        isActive: true,
        createdAt: '2024-01-08T00:00:00.000Z',
    },
    {
        id: 'u4',
        name: 'Nguyễn Minh Khoa',
        email: 'khoa.nguyen@gmail.com',
        password: 'khach123',
        role: 'customer',
        phone: '0912345678',
        username: 'khoanguyen',
        isActive: true,
        createdAt: '2024-02-01T00:00:00.000Z',
    },
    {
        id: 'u5',
        name: 'Phạm Thị Lan',
        username: 'lanpham',
        email: 'lan.pham@gmail.com',
        password: 'khach123',
        role: 'customer',
        phone: '0987654321',
        isActive: true,
        createdAt: '2024-02-10T00:00:00.000Z',
    },
]

// ─── Bus Companies ────────────────────────────────────────────────────────────

export const MOCK_COMPANIES: BusCompany[] = [
    {
        id: 'c1',
        name: 'Phương Trang',
        phone: '1900 6067',
        email: 'contact@phuongtrang.com.vn',
        address: '272 Đề Thám, Phường Phạm Ngũ Lão, Q.1, TP.HCM',
        isActive: true,
        serviceFee: 5,
        status: 'active',
        createdAt: '2024-01-05T00:00:00.000Z',
    },
    {
        id: 'c2',
        name: 'Thành Bưởi',
        phone: '1900 6067',
        email: 'contact@thanhbuoi.vn',
        address: '201 Phạm Ngũ Lão, Q.1, TP.HCM',
        isActive: true,
        serviceFee: 5,
        status: 'active',
        createdAt: '2024-01-08T00:00:00.000Z',
    },
    {
        id: 'c3',
        name: 'Hoàng Long',
        phone: '0243 943 9999',
        email: 'info@hoanglong.vn',
        address: '34 Trần Nhân Tông, Q. Hai Bà Trưng, Hà Nội',
        isActive: true,
        serviceFee: 5,
        status: 'active',
        createdAt: '2024-01-12T00:00:00.000Z',
    },
]

// ─── Buses ────────────────────────────────────────────────────────────────────

export const MOCK_BUSES: Bus[] = [
    {
        id: 'b1',
        companyId: 'c1',
        plateNumber: '51B-123.45',
        name: 'Limousine VIP 9 chỗ',
        totalSeats: 9,
        type: 'vip',
        isActive: true,
    },
    {
        id: 'b2',
        companyId: 'c1',
        plateNumber: '51B-678.90',
        name: 'Giường nằm 40 chỗ',
        totalSeats: 40,
        type: 'sleeper',
        isActive: true,
    },
    {
        id: 'b3',
        companyId: 'c2',
        plateNumber: '51C-111.22',
        name: 'Ghế ngồi 45 chỗ',
        totalSeats: 45,
        type: 'seat',
        isActive: true,
    },
    {
        id: 'b4',
        companyId: 'c2',
        plateNumber: '51C-333.44',
        name: 'Giường nằm 34 chỗ',
        totalSeats: 34,
        type: 'sleeper',
        isActive: true,
    },
    {
        id: 'b5',
        companyId: 'c3',
        plateNumber: '29B-555.66',
        name: 'Ghế ngồi 45 chỗ',
        totalSeats: 45,
        type: 'seat',
        isActive: true,
    },
]

// ─── Routes (Itineraries) ─────────────────────────────────────────────────────

export const MOCK_ROUTES: RouteItinerary[] = [
    {
        id: 'r1',
        from: 'TP. Hồ Chí Minh',
        to: 'Đà Lạt',
        distanceKm: 308,
        estimatedMinutes: 360,
    },
    {
        id: 'r2',
        from: 'TP. Hồ Chí Minh',
        to: 'Nha Trang',
        distanceKm: 448,
        estimatedMinutes: 480,
    },
    {
        id: 'r3',
        from: 'TP. Hồ Chí Minh',
        to: 'Vũng Tàu',
        distanceKm: 125,
        estimatedMinutes: 150,
    },
    {
        id: 'r4',
        from: 'Hà Nội',
        to: 'Đà Nẵng',
        distanceKm: 764,
        estimatedMinutes: 840,
    },
    {
        id: 'r5',
        from: 'Hà Nội',
        to: 'Hải Phòng',
        distanceKm: 105,
        estimatedMinutes: 120,
    },
]

// ─── Trips ────────────────────────────────────────────────────────────────────

const today = new Date()
const d = (offsetDays: number, hour: number, min = 0) => {
    const dt = new Date(today)
    dt.setDate(dt.getDate() + offsetDays)
    dt.setHours(hour, min, 0, 0)
    return dt.toISOString()
}

export const MOCK_TRIPS: Trip[] = [
    {
        id: 't1',
        companyId: 'c1',
        routeId: 'r1',
        busId: 'b1',
        departureTime: d(1, 7, 0),
        arrivalTime: d(1, 13, 0),
        pricePerSeat: 350000,
        availableSeats: 7,
        status: 'scheduled',
    },
    {
        id: 't2',
        companyId: 'c1',
        routeId: 'r1',
        busId: 'b2',
        departureTime: d(1, 20, 0),
        arrivalTime: d(2, 2, 0),
        pricePerSeat: 280000,
        availableSeats: 30,
        status: 'scheduled',
    },
    {
        id: 't3',
        companyId: 'c2',
        routeId: 'r2',
        busId: 'b3',
        departureTime: d(1, 8, 0),
        arrivalTime: d(1, 16, 0),
        pricePerSeat: 250000,
        availableSeats: 28,
        status: 'scheduled',
    },
    {
        id: 't4',
        companyId: 'c2',
        routeId: 'r3',
        busId: 'b4',
        departureTime: d(0, 9, 0),
        arrivalTime: d(0, 11, 30),
        pricePerSeat: 120000,
        availableSeats: 20,
        status: 'scheduled',
    },
    {
        id: 't5',
        companyId: 'c3',
        routeId: 'r4',
        busId: 'b5',
        departureTime: d(2, 18, 0),
        arrivalTime: d(3, 8, 0),
        pricePerSeat: 450000,
        availableSeats: 35,
        status: 'scheduled',
    },
    {
        id: 't6',
        companyId: 'c1',
        routeId: 'r2',
        busId: 'b2',
        departureTime: d(-1, 20, 0),
        arrivalTime: d(-1, 4, 0),
        pricePerSeat: 280000,
        availableSeats: 0,
        status: 'completed',
    },
]

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const MOCK_TICKETS: Ticket[] = [
    {
        id: 'tk1',
        tripId: 't1',
        customerId: 'u4',
        seatNumbers: ['A1', 'A2'],
        totalPrice: 700000,
        status: 'confirmed',
        passengerName: 'Nguyễn Minh Khoa',
        passengerPhone: '0912345678',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'tk2',
        tripId: 't6',
        customerId: 'u4',
        seatNumbers: ['B3'],
        totalPrice: 280000,
        status: 'completed',
        passengerName: 'Nguyễn Minh Khoa',
        passengerPhone: '0912345678',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
        id: 'tk3',
        tripId: 't3',
        customerId: 'u5',
        seatNumbers: ['C1'],
        totalPrice: 250000,
        status: 'confirmed',
        passengerName: 'Phạm Thị Lan',
        passengerPhone: '0987654321',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
]

// ─── Pickup Points ────────────────────────────────────────────────────────────

export const MOCK_PICKUP_POINTS: TripStop[] = [
    // t1: HCM → Đà Lạt (sáng)
    { id: 'pp1', tripId: 't1', time: d(1, 7, 0), name: 'VP Phương Trang Quận 1', address: '272 Đề Thám, P. Phạm Ngũ Lão, Q.1, TP.HCM' },
    { id: 'pp2', tripId: 't1', time: d(1, 7, 20), name: 'VP Phương Trang Bình Thạnh', address: '208 Đinh Bộ Lĩnh, P.26, Q.Bình Thạnh, TP.HCM' },
    { id: 'pp3', tripId: 't1', time: d(1, 7, 40), name: 'Bến xe Miền Đông mới', address: '292 Đinh Bộ Lĩnh, Q.Bình Thạnh, TP.HCM' },
    // t2: HCM → Đà Lạt (tối)
    { id: 'pp4', tripId: 't2', time: d(1, 20, 0), name: 'VP Phương Trang Quận 1', address: '272 Đề Thám, P. Phạm Ngũ Lão, Q.1, TP.HCM' },
    { id: 'pp5', tripId: 't2', time: d(1, 20, 30), name: 'Bến xe Miền Đông mới', address: '292 Đinh Bộ Lĩnh, Q.Bình Thạnh, TP.HCM' },
    // t3: HCM → Nha Trang
    { id: 'pp6', tripId: 't3', time: d(1, 8, 0), name: 'VP Thành Bưởi Quận 10', address: '265 Lê Hồng Phong, P.15, Q.10, TP.HCM' },
    { id: 'pp7', tripId: 't3', time: d(1, 8, 30), name: 'Bến xe Miền Đông mới', address: '292 Đinh Bộ Lĩnh, Q.Bình Thạnh, TP.HCM' },
    // t4: HCM → Vũng Tàu
    { id: 'pp8', tripId: 't4', time: d(0, 9, 0), name: 'VP Thành Bưởi Quận 10', address: '265 Lê Hồng Phong, P.15, Q.10, TP.HCM' },
    { id: 'pp9', tripId: 't4', time: d(0, 9, 15), name: 'Bến xe Miền Tây', address: '395 Kinh Dương Vương, Q.Bình Tân, TP.HCM' },
    // t5: Hà Nội → Đà Nẵng
    { id: 'pp10', tripId: 't5', time: d(2, 18, 0), name: 'VP Hoàng Long Hai Bà Trưng', address: '34 Trần Nhân Tông, Q.HBT, Hà Nội' },
    { id: 'pp11', tripId: 't5', time: d(2, 18, 30), name: 'Bến xe Giáp Bát', address: '8 Giáp Bát, Q.Hoàng Mai, Hà Nội' },
    { id: 'pp12', tripId: 't5', time: d(2, 19, 0), name: 'Bến xe Nước Ngầm', address: 'Km 8+500 QL1A, Q.Hoàng Mai, Hà Nội' },
]

// ─── Dropoff Points ───────────────────────────────────────────────────────────

export const MOCK_DROPOFF_POINTS: TripStop[] = [
    // t1: → Đà Lạt (sáng)
    { id: 'dp1', tripId: 't1', time: d(1, 13, 0), name: 'Bến xe Đà Lạt', address: '01 Tô Hiến Thành, P.3, TP.Đà Lạt' },
    { id: 'dp2', tripId: 't1', time: d(1, 13, 0), name: 'VP Phương Trang Đà Lạt', address: '2 Nguyễn Thị Minh Khai, P.1, TP.Đà Lạt' },
    // t2: → Đà Lạt (tối)
    { id: 'dp3', tripId: 't2', time: d(2, 2, 0), name: 'Bến xe Đà Lạt', address: '01 Tô Hiến Thành, P.3, TP.Đà Lạt' },
    { id: 'dp4', tripId: 't2', time: d(2, 2, 0), name: 'VP Phương Trang Đà Lạt', address: '2 Nguyễn Thị Minh Khai, P.1, TP.Đà Lạt' },
    // t3: → Nha Trang
    { id: 'dp5', tripId: 't3', time: d(1, 16, 0), name: 'Bến xe Phía Nam Nha Trang', address: '23/10, TP.Nha Trang, Khánh Hòa' },
    { id: 'dp6', tripId: 't3', time: d(1, 16, 0), name: 'VP Thành Bưởi Nha Trang', address: '45 Lê Thánh Tôn, TP.Nha Trang' },
    // t4: → Vũng Tàu
    { id: 'dp7', tripId: 't4', time: d(0, 11, 30), name: 'Bến xe Vũng Tàu', address: '52 Nam Kỳ Khởi Nghĩa, TP.Vũng Tàu' },
    { id: 'dp8', tripId: 't4', time: d(0, 11, 30), name: 'Vinpearl Bãi Dâu, Vũng Tàu', address: 'Bãi Dâu, TP.Vũng Tàu, Bà Rịa' },
    // t5: → Đà Nẵng
    { id: 'dp9', tripId: 't5', time: d(3, 8, 0), name: 'Bến xe Đà Nẵng', address: '33 Điện Biên Phủ, Q.Thanh Khê, Đà Nẵng' },
    { id: 'dp10', tripId: 't5', time: d(3, 8, 0), name: 'VP Hoàng Long Đà Nẵng', address: '12 Trần Phú, Q.Hải Châu, Đà Nẵng' },
]
