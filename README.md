# Sales Navigator Export Helper

A Chrome extension to assist in exporting data from LinkedIn Sales Navigator.

## ⚠️ Important Warning

This tool automates actions on LinkedIn Sales Navigator and is against their Terms of Service. Use at your own risk. Your account could be restricted or banned. Avoid exporting large amounts of data quickly.

## Features

- Export profile data from Sales Navigator search results
- Configurable delay between actions to mimic human behavior
- Progress tracking
- CSV export
- Clean, modern UI

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/sales-navigator-export.git
   cd sales-navigator-export
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory from this project

## Usage

1. Navigate to a Sales Navigator search results page
2. Click the extension icon in your browser toolbar
3. Click "Start Export" to begin scraping
4. The extension will automatically:
   - Extract profile data from the current page
   - Navigate to the next page
   - Continue until stopped or reaching the maximum profiles
5. Click "Stop Export" at any time to end the process
6. The data will be automatically downloaded as a CSV file

## Development

- `npm run build` - Build the extension
- `npm run watch` - Build and watch for changes
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
  ├── background.ts    # Background service worker
  ├── contentScript.ts # Content script for DOM interaction
  ├── popup.ts        # Popup UI logic
  ├── types.ts        # TypeScript type definitions
  ├── utils.ts        # Utility functions
  ├── selectors.ts    # DOM selectors
  ├── popup.html      # Popup UI
  └── options.html    # Options page UI
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes only. Use at your own risk. The developers are not responsible for any consequences resulting from the use of this tool.
