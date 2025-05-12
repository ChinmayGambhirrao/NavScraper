import { Message, ProfileData } from './types';
import { selectors } from './selectors';
import { formatTimestamp } from './utils';

class ContentScript {
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private processingDelay: number = 2000; // 2 seconds between actions

  constructor() {
    this.initializeMessageListener();
  }

  private initializeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      if (message.type === 'START_SCRAPING') {
        this.startScraping();
      } else if (message.type === 'STOP_SCRAPING') {
        this.stopScraping();
      }
    });
  }

  private async startScraping(): Promise<void> {
    this.isRunning = true;
    this.retryCount = 0;
    await this.scrapeCurrentPage();
  }

  private stopScraping(): void {
    this.isRunning = false;
  }

  private async scrapeCurrentPage(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Wait for the page to be fully loaded and interactive
      await this.waitForPageLoad();
      
      // Check if we're on a valid Sales Navigator page
      if (!this.isValidSalesNavigatorPage()) {
        throw new Error('Not a valid Sales Navigator page');
      }

      const profiles = await this.extractProfilesFromPage();
      if (profiles.length > 0) {
        this.sendMessage('SCRAPED_DATA', profiles);
        this.sendMessage('PAGE_PROCESSED');
        this.retryCount = 0; // Reset retry count on success
      } else {
        throw new Error('No profiles found on page');
      }

      if (this.isRunning) {
        await this.handlePagination();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Scraping error:', errorMessage);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying (${this.retryCount}/${this.maxRetries})...`);
        await this.wait(this.processingDelay * this.retryCount);
        await this.scrapeCurrentPage();
      } else {
        this.sendMessage('CONTENT_SCRIPT_ERROR', { error: errorMessage });
      }
    }
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }

      window.addEventListener('load', () => resolve());
    });
  }

  private isValidSalesNavigatorPage(): boolean {
    return document.querySelector(selectors.profileCard) !== null;
  }

  private async extractProfilesFromPage(): Promise<ProfileData[]> {
    await this.wait(this.processingDelay); // Add delay before starting extraction
    
    const profileElements = Array.from(document.querySelectorAll(selectors.profileCard));
    console.log('Found profile elements:', profileElements.length);
    const profiles: ProfileData[] = [];

    for (const element of profileElements) {
      if (!this.isRunning) break;

      try {
        // Scroll element into view to ensure it's loaded
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(500); // Wait for any animations

        const profile = await this.extractProfileData(element);
        if (profile) {
          console.log('Extracted profile:', profile);
          profiles.push(profile);
        }

        // Add random delay between profiles
        await this.wait(this.getRandomDelay(1000, 2000));
      } catch (error) {
        console.error('Error processing profile:', error);
        continue;
      }
    }

    console.log('Total profiles extracted:', profiles.length);
    return profiles;
  }

  private async extractProfileData(element: Element): Promise<ProfileData | null> {
    try {
      // Ensure element is in viewport
      const rect = element.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(500);
      }

      const nameElement = element.querySelector(selectors.name);
      const titleElement = element.querySelector(selectors.title);
      const companyElement = element.querySelector(selectors.company);
      const locationElement = element.querySelector(selectors.location);
      const profileLinkElement = element.querySelector(selectors.profileLink) as HTMLAnchorElement;
      const linkedInLinkElement = element.querySelector(selectors.linkedInLink) as HTMLAnchorElement;

      if (!nameElement || !profileLinkElement?.href) {
        console.log('Missing required profile data');
        return null;
      }

      // Extract text with proper error handling
      const name = this.safeGetText(nameElement);
      const title = this.safeGetText(titleElement);
      const company = this.safeGetText(companyElement);
      const location = this.safeGetText(locationElement);

      return {
        name,
        title,
        company,
        location,
        profileUrl: profileLinkElement.href,
        linkedInUrl: linkedInLinkElement?.href || '',
        timestamp: formatTimestamp()
      };
    } catch (error) {
      console.error('Error extracting profile data:', error);
      return null;
    }
  }

  private safeGetText(element: Element | null): string {
    if (!element) return '';
    const text = element.textContent?.trim();
    return text || '';
  }

  private async handlePagination(): Promise<void> {
    const nextButton = document.querySelector(selectors.nextButton) as HTMLButtonElement;
    
    if (nextButton && !nextButton.disabled) {
      // Scroll to the next button
      nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(1000);

      // Click the button
      nextButton.click();
      await this.waitForNewContent();
    } else {
      this.stopScraping();
    }
  }

  private async waitForNewContent(): Promise<void> {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations, obs) => {
        const loadingIndicator = document.querySelector(selectors.loadingIndicator);
        if (!loadingIndicator) {
          obs.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 10000);
    });
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private sendMessage(type: Message['type'], payload?: any): void {
    chrome.runtime.sendMessage({ type, payload });
  }
}

// Initialize the content script
new ContentScript(); 