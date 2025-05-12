import { Message } from './types';
import { isSalesNavigatorPage } from './utils';

class Popup {
  private startBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private progress: HTMLElement;
  private profilesCount: HTMLElement;
  private currentPage: HTMLElement;
  private error: HTMLElement;
  private isScraping: boolean;

  constructor() {
    // Initialize properties
    this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    this.progress = document.querySelector('.progress') as HTMLElement;
    this.profilesCount = document.getElementById('profilesCount') as HTMLElement;
    this.currentPage = document.getElementById('currentPage') as HTMLElement;
    this.error = document.getElementById('error') as HTMLElement;
    this.isScraping = false;

    this.initializeEventListeners();
    this.checkCurrentTab();
  }

  private initializeEventListeners(): void {
    this.startBtn.addEventListener('click', () => this.handleStart());
    this.stopBtn.addEventListener('click', () => this.handleStop());
    chrome.runtime.onMessage.addListener((message: Message) => this.handleMessage(message));
  }

  private async checkCurrentTab(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url || !isSalesNavigatorPage(tab.url)) {
        this.showError('Please navigate to a Sales Navigator page');
        this.startBtn.disabled = true;
      }
    } catch (error) {
      console.error('Error checking current tab:', error);
      this.showError('Error checking current tab');
    }
  }

  private async handleStart(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      this.isScraping = true;
      this.updateUI();
      chrome.runtime.sendMessage({ type: 'START_SCRAPING' });
    } catch (error) {
      console.error('Error starting scraping:', error);
      this.showError('Failed to start scraping');
    }
  }

  private handleStop(): void {
    this.isScraping = false;
    this.updateUI();
    chrome.runtime.sendMessage({ type: 'STOP_SCRAPING' });
  }

  private handleMessage(message: Message): void {
    switch (message.type) {
      case 'UPDATE_PROGRESS':
        this.updateProgress(message.payload);
        break;
      case 'CONTENT_SCRIPT_ERROR':
        this.showError(message.payload.error);
        this.handleStop();
        break;
    }
  }

  private updateProgress(payload: { profilesScraped: number; currentPage: number; isScraping: boolean }): void {
    this.profilesCount.textContent = payload.profilesScraped.toString();
    this.currentPage.textContent = payload.currentPage.toString();
    this.isScraping = payload.isScraping;
    this.updateUI();
  }

  private updateUI(): void {
    this.startBtn.style.display = this.isScraping ? 'none' : 'block';
    this.stopBtn.style.display = this.isScraping ? 'block' : 'none';
    this.progress.classList.toggle('active', this.isScraping);
  }

  private showError(message: string): void {
    this.error.textContent = message;
    this.error.style.display = 'block';
    setTimeout(() => {
      this.error.style.display = 'none';
    }, 5000);
  }
}

// Initialize the popup
new Popup(); 