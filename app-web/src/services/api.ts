import { IApiService } from './types';
import { MockApiService } from './MockApiService';
import { RealApiService } from './RealApiService/index';

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// @ts-ignore
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'; // Default to true


export const api: IApiService = USE_MOCK
    ? new MockApiService()
    : new RealApiService(API_BASE_URL);
