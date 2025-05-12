export interface ProfileData {
    name: string;
    title: string;
    company: string;
    location: string;
    profileUrl: string;
    linkedInUrl: string;
    timestamp: string;
}
export interface ScrapingConfig {
    delayMin: number;
    delayMax: number;
    maxProfiles: number;
    fieldsToExtract: (keyof ProfileData)[];
}
export interface ScrapingState {
    isScraping: boolean;
    profilesScraped: number;
    currentPage: number;
    collectedData: ProfileData[];
}
export type MessageType = 'START_SCRAPING' | 'STOP_SCRAPING' | 'SCRAPED_DATA' | 'PAGE_PROCESSED' | 'CONTENT_SCRIPT_ERROR' | 'UPDATE_PROGRESS';
export interface Message {
    type: MessageType;
    payload?: any;
}
