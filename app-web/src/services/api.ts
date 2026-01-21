import { IApiService } from './types';
import { MockApiService } from './MockApiService';
import { RealApiService } from './RealApiService/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'; // Default to true

console.log(`[App] Initializing API Service using ${USE_MOCK ? 'Mock' : 'Real'} implementation.`);

export const api: IApiService = USE_MOCK
    ? new MockApiService()
    : new RealApiService(API_BASE_URL);
