import { ProfileData } from './types';
export declare const sleep: (ms: number) => Promise<void>;
export declare const getRandomDelay: (min: number, max: number) => number;
export declare const performActionWithDelay: (action: () => Promise<void>, minDelay: number, maxDelay: number) => Promise<void>;
export declare const convertToCSV: (data: ProfileData[]) => string;
export declare const downloadCSV: (data: ProfileData[]) => void;
export declare const isSalesNavigatorPage: (url: string) => boolean;
export declare const formatTimestamp: () => string;
