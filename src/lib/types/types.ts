// src/lib/types.ts
export interface User {
    id?: number;
    username: string;
    email: string;
    role: 'patient' | 'doctor' | 'admin';
    firstName: string;
    lastName: string;
}

// API response types
export type ApiResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
};

// Common status types
export enum Status {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error'
}

// Pagination types
export interface PaginationParams {
    page: number;
    limit: number;
    totalPages?: number;
    totalItems?: number;
}

// Generic form state type
export type FormState<T> = {
    values: T;
    errors?: Partial<Record<keyof T, string>>;
    isSubmitting: boolean;
};