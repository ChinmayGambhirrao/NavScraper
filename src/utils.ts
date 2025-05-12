import { ProfileData } from './types';

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getRandomDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const performActionWithDelay = async (
  action: () => Promise<void>,
  minDelay: number,
  maxDelay: number
): Promise<void> => {
  const delay = getRandomDelay(minDelay, maxDelay);
  await sleep(delay);
  await action();
};

export const convertToCSV = (data: ProfileData[]): string => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof ProfileData];
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = String(value).replace(/"/g, '""');
        return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

export const downloadCSV = (data: ProfileData[]): void => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `sales_navigator_export_${Date.now()}.csv`,
    saveAs: true
  });
  
  URL.revokeObjectURL(url);
};

export const isSalesNavigatorPage = (url: string): boolean => {
  return url.startsWith('https://www.linkedin.com/sales/');
};

export const formatTimestamp = (): string => {
  return new Date().toISOString();
}; 