export interface ApiSuccess<T> {
    data: T,
    error: null;
}

export interface ApiFailure {
    data: null;
    error: {
        code: string;
        message: string;
    }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;