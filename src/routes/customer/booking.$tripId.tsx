import { createFileRoute } from '@tanstack/react-router'
import { BookingPage } from '@/components/customer/booking/booking-page'

function BookingRoute() {
    const { tripId } = Route.useParams()
    return <BookingPage tripId={tripId} />
}

export const Route = createFileRoute('/customer/booking/$tripId')({ component: BookingRoute })
