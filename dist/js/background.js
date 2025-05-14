new (class {
  constructor() {
    (this.state = {
      isScraping: !1,
      profilesScraped: 0,
      currentPage: 1,
      collectedData: [],
    }),
      (this.defaultConfig = {
        delayMin: 2e3,
        delayMax: 5e3,
        maxProfiles: 100,
        fieldsToExtract: [
          "name",
          "title",
          "company",
          "location",
          "profileUrl",
          "linkedInUrl",
          "timestamp",
        ],
      }),
      this.initializeMessageListener();
  }
  initializeMessageListener() {
    chrome.runtime.onMessage.addListener((e, t, a) => {
      switch (e.type) {
        case "START_SCRAPING":
          this.handleStartScraping(t.tab?.id, e.maxProfiles);
          break;
        case "STOP_SCRAPING":
          this.handleStopScraping();
          break;
        case "SCRAPED_DATA":
          this.handleScrapedData(e.payload);
          break;
        case "PAGE_PROCESSED":
          this.handlePageProcessed();
          break;
        case "CONTENT_SCRIPT_ERROR":
          this.handleError(e.payload);
      }
    });
  }
  async handleStartScraping(e, maxProfiles) {
    if (e)
      try {
        if (
          !((await chrome.tabs.get(e)).url || "").startsWith(
            "https://www.linkedin.com/sales/"
          )
        )
          throw new Error("Not a Sales Navigator page");
        (this.state = {
          isScraping: !0,
          profilesScraped: 0,
          currentPage: 1,
          collectedData: [],
        }),
          (this.defaultConfig.maxProfiles = maxProfiles || 100);
        await this.injectContentScript(e),
          await this.sendMessageToTab(e, "START_SCRAPING");
      } catch (e) {
        console.error("Error starting scraping:", e),
          this.handleError({ error: "Failed to start scraping" });
      }
  }
  async handleStopScraping() {
    (this.state.isScraping = !1),
      this.state.collectedData.length > 0 &&
        ((e) => {
          const t = ((e) => {
              if (!e || 0 === e.length) return "";
              const t = Object.keys(e[0]);
              return [
                t.join(","),
                ...e.map((e) =>
                  t
                    .map((t) => {
                      const a = e[t],
                        r = String(a).replace(/"/g, '""');
                      return /[",\n\r]/.test(r) ? `"${r}"` : r;
                    })
                    .join(",")
                ),
              ].join("\n");
            })(e),
            a = new Blob([t], { type: "text/csv;charset=utf-8;" }),
            r = URL.createObjectURL(a);
          chrome.downloads.download({
            url: r,
            filename: `sales_navigator_export_${Date.now()}.csv`,
            saveAs: !0,
          }),
            URL.revokeObjectURL(r);
        })(this.state.collectedData);
  }
  handleScrapedData(e) {
    this.state.isScraping &&
      (this.state.collectedData.push(...e),
      (this.state.profilesScraped += e.length),
      this.sendProgressUpdate());
  }
  handlePageProcessed() {
    this.state.isScraping &&
      (this.state.currentPage++,
      this.sendProgressUpdate(),
      this.state.profilesScraped >= this.defaultConfig.maxProfiles &&
        this.handleStopScraping());
  }
  handleError(e) {
    console.error("Scraping error:", e.error), this.handleStopScraping();
  }
  async injectContentScript(e) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: e },
        files: ["js/contentScript.js"],
      });
    } catch (e) {
      throw (console.error("Error injecting content script:", e), e);
    }
  }
  async sendMessageToTab(e, t, a) {
    try {
      await chrome.tabs.sendMessage(e, { type: t, payload: a });
    } catch (e) {
      throw (console.error("Error sending message to tab:", e), e);
    }
  }
  sendProgressUpdate() {
    chrome.runtime.sendMessage({
      type: "UPDATE_PROGRESS",
      payload: {
        profilesScraped: this.state.profilesScraped,
        currentPage: this.state.currentPage,
        isScraping: this.state.isScraping,
      },
    });
  }
})();
