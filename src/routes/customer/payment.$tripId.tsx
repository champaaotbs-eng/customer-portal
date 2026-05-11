import { createFileRoute } from '@tanstack/react-router'
import { PaymentPage } from '@/components/customer/payment/payment-page'

export const Route = createFileRoute('/customer/payment/$tripId')({
    validateSearch: (search: Record<string, unknown>) => ({
        seatIds: (search.seatIds as string) ?? '',
        pickupStopId: (search.pickupStopId as string) ?? '',
        dropoffStopId: (search.dropoffStopId as string) ?? '',
        passengerName: (search.passengerName as string) ?? '',
        passengerEmail: (search.passengerEmail as string) ?? '',
        passengerPhone: (search.passengerPhone as string) ?? '',
        note: (search.note as string) ?? '',
    }),
    component: PaymentRoute,
})

function PaymentRoute() {
    const { tripId } = Route.useParams()
    const search = Route.useSearch()
    return <PaymentPage tripId={tripId} search={search} />
}
