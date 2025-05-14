(() => {
  "use strict";
  new (class {
    constructor() {
      (this.startBtn = document.getElementById("startBtn")),
        (this.stopBtn = document.getElementById("stopBtn")),
        (this.progress = document.querySelector(".progress")),
        (this.profilesCount = document.getElementById("profilesCount")),
        (this.currentPage = document.getElementById("currentPage")),
        (this.error = document.getElementById("error")),
        (this.isScraping = !1),
        this.initializeEventListeners(),
        this.checkCurrentTab();
    }
    initializeEventListeners() {
      this.startBtn.addEventListener("click", () => this.handleStart()),
        this.stopBtn.addEventListener("click", () => this.handleStop()),
        chrome.runtime.onMessage.addListener((t) => this.handleMessage(t));
    }
    async checkCurrentTab() {
      try {
        const [t] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
        (t.url && t.url.startsWith("https://www.linkedin.com/sales/")) ||
          (this.showError("Please navigate to a Sales Navigator page"),
          (this.startBtn.disabled = !0));
      } catch (t) {
        console.error("Error checking current tab:", t),
          this.showError("Error checking current tab");
      }
    }
    async handleStart() {
      try {
        const [t] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
        if (!t.id) throw new Error("No active tab found");
        const profileLimit =
          parseInt(document.getElementById("profileLimit").value, 10) || 100;
        (this.isScraping = !0),
          this.updateUI(),
          chrome.runtime.sendMessage({
            type: "START_SCRAPING",
            maxProfiles: profileLimit,
          });
      } catch (t) {
        console.error("Error starting scraping:", t),
          this.showError("Failed to start scraping");
      }
    }
    handleStop() {
      (this.isScraping = !1),
        this.updateUI(),
        chrome.runtime.sendMessage({ type: "STOP_SCRAPING" });
    }
    handleMessage(t) {
      switch (t.type) {
        case "UPDATE_PROGRESS":
          this.updateProgress(t.payload);
          break;
        case "CONTENT_SCRIPT_ERROR":
          this.showError(t.payload.error), this.handleStop();
      }
    }
    updateProgress(t) {
      (this.profilesCount.textContent = t.profilesScraped.toString()),
        (this.currentPage.textContent = t.currentPage.toString()),
        (this.isScraping = t.isScraping),
        this.updateUI();
    }
    updateUI() {
      (this.startBtn.style.display = this.isScraping ? "none" : "block"),
        (this.stopBtn.style.display = this.isScraping ? "block" : "none"),
        this.progress.classList.toggle("active", this.isScraping);
    }
    showError(t) {
      (this.error.textContent = t),
        (this.error.style.display = "block"),
        setTimeout(() => {
          this.error.style.display = "none";
        }, 5e3);
    }
  })();
})();
