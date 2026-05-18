const VIETQR_GENERATE_URL = 'https://api.vietqr.io/v2/generate'

type GenerateVietQrInput = {
    accountNo: string
    accountName: string
    acqId: string
    amount: number
    addInfo: string
    signal?: AbortSignal
}

type VietQrGenerateResponse = {
    code?: string
    desc?: string
    qrDataURL?: string
    data?: {
        qrDataURL?: string
    }
}

const optionalHeader = (value: string | undefined) => value?.trim() || undefined

export async function generateVietQrDataUrl({
    accountNo,
    accountName,
    acqId,
    amount,
    addInfo,
    signal,
}: GenerateVietQrInput): Promise<string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    const clientId = optionalHeader(import.meta.env.VITE_VIETQR_CLIENT_ID)
    const apiKey = optionalHeader(import.meta.env.VITE_VIETQR_API_KEY)

    if (clientId) {
        headers['x-client-id'] = clientId
    }

    if (apiKey) {
        headers['x-api-key'] = apiKey
    }

    const response = await fetch(VIETQR_GENERATE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            accountNo,
            accountName,
            acqId,
            amount,
            addInfo,
            format: 'text',
            template: 'compact',
        }),
        signal,
    })

    let payload: VietQrGenerateResponse | null = null

    try {
        payload = (await response.json()) as VietQrGenerateResponse
    } catch {
        payload = null
    }

    const qrDataUrl = payload?.data?.qrDataURL ?? payload?.qrDataURL
    if (response.ok && typeof qrDataUrl === 'string' && qrDataUrl.length > 0) {
        return qrDataUrl
    }

    throw new Error(payload?.desc || 'vietqr_generate_failed')
}
