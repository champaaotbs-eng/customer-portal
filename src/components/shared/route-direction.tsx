interface RouteDirectionProps {
    pickup?: string | null
    dropoff?: string | null
    pickupLabel?: string
    dropoffLabel?: string
    emptyLabel?: string
    className?: string
}

export const RouteDirection = ({
    pickup,
    dropoff,
    pickupLabel = 'PICKUP',
    dropoffLabel = 'DROPOFF',
    emptyLabel = '—',
    className = '',
}: RouteDirectionProps) => {
    const pickupText = pickup || emptyLabel
    const dropoffText = dropoff || emptyLabel

    return (
        <div className={`min-w-0 space-y-0.5 text-xs ${className}`}>
            <div className="flex min-w-0 gap-1.5">
                <span className="shrink-0 font-semibold text-muted-foreground">{pickupLabel}:</span>
                <span className="min-w-0 break-words text-foreground">{pickupText}</span>
            </div>
            <div className="flex min-w-0 gap-1.5">
                <span className="shrink-0 font-semibold text-muted-foreground">{dropoffLabel}:</span>
                <span className="min-w-0 break-words text-foreground">{dropoffText}</span>
            </div>
        </div>
    )
}
