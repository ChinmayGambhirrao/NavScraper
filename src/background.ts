import { Message, ProfileData, ScrapingConfig, ScrapingState } from './types';
import { downloadCSV, isSalesNavigatorPage, performActionWithDelay } from './utils';

class BackgroundScript {
  private state: ScrapingState = {
    isScraping: false,
    profilesScraped: 0,
    currentPage: 1,
    collectedData: []
  };

  private defaultConfig: ScrapingConfig = {
    delayMin: 2000,
    delayMax: 5000,
    maxProfiles: 100,
    fieldsToExtract: ['name', 'title', 'company', 'location', 'profileUrl', 'linkedInUrl', 'timestamp']
  };

  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.initializeMessageListener();
  }

  private initializeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      switch (message.type) {
        case 'START_SCRAPING':
          this.handleStartScraping(sender.tab?.id);
          break;
        case 'STOP_SCRAPING':
          this.handleStopScraping();
          break;
        case 'SCRAPED_DATA':
          this.handleScrapedData(message.payload);
          break;
        case 'PAGE_PROCESSED':
          this.handlePageProcessed();
          break;
        case 'CONTENT_SCRIPT_ERROR':
          this.handleError(message.payload);
          break;
      }
    });
  }

  private async handleStartScraping(tabId?: number): Promise<void> {
    if (!tabId) return;

    try {
      const tab = await chrome.tabs.get(tabId);
      if (!isSalesNavigatorPage(tab.url || '')) {
        throw new Error('Not a Sales Navigator page');
      }

      // Reset state
      this.state = {
        isScraping: true,
        profilesScraped: 0,
        currentPage: 1,
        collectedData: []
      };
      this.retryCount = 0;

      // Ensure content script is loaded
      await this.injectContentScript(tabId);
      
      // Add a delay before starting to ensure page is ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.sendMessageToTab(tabId, 'START_SCRAPING');
      console.log('Scraping started successfully');
    } catch (error) {
      console.error('Error starting scraping:', error);
      this.handleError({ error: 'Failed to start scraping: ' + (error instanceof Error ? error.message : String(error)) });
    }
  }

  private async handleStopScraping(): Promise<void> {
    console.log('Stopping scraping. Total data collected:', this.state.collectedData.length);
    this.state.isScraping = false;
    
    if (this.state.collectedData.length > 0) {
      try {
        console.log('Attempting to download CSV...');
        await this.downloadData();
        console.log('CSV download completed successfully');
      } catch (error) {
        console.error('Error downloading CSV:', error);
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying download (${this.retryCount}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * this.retryCount));
          await this.handleStopScraping();
        } else {
          this.handleError({ error: 'Failed to download CSV after multiple attempts' });
        }
      }
    } else {
      console.log('No data collected, skipping CSV download');
    }
  }

  private async downloadData(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        downloadCSV(this.state.collectedData);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleScrapedData(profiles: ProfileData[]): void {
    if (!this.state.isScraping) return;

    try {
      console.log('Received profiles from content script:', profiles.length);
      
      // Validate and deduplicate profiles
      const validProfiles = profiles.filter(profile => 
        profile.name && 
        profile.profileUrl && 
        !this.state.collectedData.some(existing => existing.profileUrl === profile.profileUrl)
      );

      if (validProfiles.length > 0) {
        this.state.collectedData.push(...validProfiles);
        this.state.profilesScraped += validProfiles.length;
        console.log('Total profiles collected:', this.state.profilesScraped);
        this.retryCount = 0; // Reset retry count on successful data collection
      } else {
        console.log('No valid new profiles found in batch');
      }

      this.sendProgressUpdate();
    } catch (error) {
      console.error('Error handling scraped data:', error);
      this.handleError({ error: 'Failed to process scraped data: ' + (error instanceof Error ? error.message : String(error)) });
    }
  }

  private handlePageProcessed(): void {
    if (!this.state.isScraping) return;

    this.state.currentPage++;
    this.sendProgressUpdate();

    if (this.state.profilesScraped >= this.defaultConfig.maxProfiles) {
      this.handleStopScraping();
    }
  }

  private handleError(payload: { error: string }): void {
    console.error('Scraping error:', payload.error);
    
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying after error (${this.retryCount}/${this.maxRetries})...`);
      setTimeout(() => {
        if (this.state.isScraping) {
          this.handleStopScraping();
        }
      }, 2000 * this.retryCount);
    } else {
      this.handleStopScraping();
    }
  }

  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['js/contentScript.js']
      });
    } catch (error) {
      console.error('Error injecting content script:', error);
      throw error;
    }
  }

  private async sendMessageToTab(tabId: number, type: Message['type'], payload?: any): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, { type, payload });
    } catch (error) {
      console.error('Error sending message to tab:', error);
      throw error;
    }
  }

  private sendProgressUpdate(): void {
    chrome.runtime.sendMessage({
      type: 'UPDATE_PROGRESS',
      payload: {
        profilesScraped: this.state.profilesScraped,
        currentPage: this.state.currentPage,
        isScraping: this.state.isScraping
      }
    });
  }
}

// Initialize the background script
new BackgroundScript(); 