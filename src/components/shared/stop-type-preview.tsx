export interface StopPreviewItem {
    time?: string | null
    name?: string | null
    address?: string | null
}

interface StopTypePreviewProps {
    pickupStops: StopPreviewItem[]
    dropoffStops: StopPreviewItem[]
    pickupLabel: string
    dropoffLabel: string
    emptyLabel: string
}

export const StopTypePreview = ({
    pickupStops,
    dropoffStops,
    pickupLabel,
    dropoffLabel,
    emptyLabel,
}: StopTypePreviewProps) => {
    const renderStops = (stops: StopPreviewItem[]) => {
        if (!stops.length) {
            return <p className="text-xs text-muted-foreground">{emptyLabel}</p>
        }

        return (
            <ol className="space-y-2">
                {stops.map((stop, index) => (
                    <li key={`${stop.name ?? emptyLabel}-${index}`} className="flex min-w-0 gap-2 rounded-md bg-background/70 p-2 text-xs">
                        <span className="shrink-0 text-muted-foreground">{index + 1}.</span>
                        <div className="min-w-0 space-y-0.5">
                            <p className="font-medium tabular-nums text-muted-foreground">{stop.time || emptyLabel}</p>
                            <p className="break-words font-semibold text-foreground">{stop.name || emptyLabel}</p>
                            <p className="break-words text-muted-foreground">{stop.address || emptyLabel}</p>
                        </div>
                    </li>
                ))}
            </ol>
        )
    }

    return (
        <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{pickupLabel}</p>
                {renderStops(pickupStops)}
            </div>
            <div className="min-w-0 space-y-2 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{dropoffLabel}</p>
                {renderStops(dropoffStops)}
            </div>
        </div>
    )
}
