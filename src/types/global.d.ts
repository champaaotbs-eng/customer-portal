export { };

declare global {
    interface IResponse<T> {
        error?: string | string[];
        message: string | string[];
        statusCode: number | string;
        data?: T;
    }
}

declare module 'axios' {
    interface AxiosError<T = unknown, D = any> {
        localizedMessage?: string
    }
}
