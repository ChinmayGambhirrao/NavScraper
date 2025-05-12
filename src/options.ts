import { ScrapingConfig, ProfileData } from './types';

class Options {
  private delayMinInput!: HTMLInputElement;
  private delayMaxInput!: HTMLInputElement;
  private maxProfilesInput!: HTMLInputElement;
  private fieldCheckboxes!: { [key: string]: HTMLInputElement };
  private saveButton!: HTMLButtonElement;
  private statusDiv!: HTMLDivElement;

  constructor() {
    this.initializeElements();
    this.loadSettings();
    this.initializeEventListeners();
  }

  private initializeElements(): void {
    this.delayMinInput = document.getElementById('delayMin') as HTMLInputElement;
    this.delayMaxInput = document.getElementById('delayMax') as HTMLInputElement;
    this.maxProfilesInput = document.getElementById('maxProfiles') as HTMLInputElement;
    this.saveButton = document.getElementById('saveBtn') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;

    this.fieldCheckboxes = {
      name: document.getElementById('fieldName') as HTMLInputElement,
      title: document.getElementById('fieldTitle') as HTMLInputElement,
      company: document.getElementById('fieldCompany') as HTMLInputElement,
      location: document.getElementById('fieldLocation') as HTMLInputElement,
      profileUrl: document.getElementById('fieldProfileUrl') as HTMLInputElement,
      linkedInUrl: document.getElementById('fieldLinkedInUrl') as HTMLInputElement
    };
  }

  private initializeEventListeners(): void {
    this.saveButton.addEventListener('click', () => this.saveSettings());
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('scrapingConfig');
      const config = result.scrapingConfig as ScrapingConfig;

      if (config) {
        this.delayMinInput.value = config.delayMin.toString();
        this.delayMaxInput.value = config.delayMax.toString();
        this.maxProfilesInput.value = config.maxProfiles.toString();

        config.fieldsToExtract.forEach(field => {
          if (this.fieldCheckboxes[field]) {
            this.fieldCheckboxes[field].checked = true;
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', false);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const config: ScrapingConfig = {
        delayMin: parseInt(this.delayMinInput.value),
        delayMax: parseInt(this.delayMaxInput.value),
        maxProfiles: parseInt(this.maxProfilesInput.value),
        fieldsToExtract: Object.entries(this.fieldCheckboxes)
          .filter(([_, checkbox]) => checkbox.checked)
          .map(([field]) => field as keyof ProfileData)
      };

      await chrome.storage.local.set({ scrapingConfig: config });
      this.showStatus('Settings saved successfully', true);
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', false);
    }
  }

  private showStatus(message: string, isSuccess: boolean): void {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
    
    setTimeout(() => {
      this.statusDiv.className = 'status';
    }, 3000);
  }
}

// Initialize the options page
new Options(); 