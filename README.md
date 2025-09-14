# Via Extension
  A VS Code extension that brings design inspiration directly into your coding workflow.

  ## What is Via?

  Via curates trending UI designs and displays them in your VS Code sidebar, so you can find design inspiration
  without leaving your editor. No more switching between browser tabs or losing focus - get the visual references
  you need right where you code.

  ## Features

  - **Design Gallery**: Browse curated UI designs from popular sources
  - **Trend Analysis**: AI-powered categorization of current design patterns
  - **Seamless Workflow**: View inspiration directly in your VS Code sidebar
  - **Project-Focused**: Get designs relevant to your specific project type
  - **Visual Reference**: Save and organize designs for your projects

  ## Installation

  1. Download the extension from the VS Code marketplace
  2. Install and reload VS Code
  3. Set up your API keys via the command palette:
     - `VIA: Set Firecrawl API Key`
     - `VIA: Set OpenRouter API Key`

  ## Usage

  1. Open the Via sidebar from the activity bar
  2. Describe your project or design needs
  3. Browse curated design inspiration
  4. Reference the designs while building your own components

  ## Requirements

  - VS Code 1.85.0 or higher
  - Firecrawl API key for web scraping
  - OpenRouter API key for design analysis

  ## Commands

  - `VIA: Inspire & Design` - Start the design discovery process
  - `VIA: Set Firecrawl API Key` - Configure your Firecrawl API key
  - `VIA: Set OpenRouter API Key` - Configure your OpenRouter API key
  - `VIA: Open Results Folder` - View saved design inspiration

  ## Development

  ```bash
  npm install
  npm run compile

  Press F5 to launch the extension in a new VS Code window.

  Built With

  - TypeScript
  - VS Code Extension API
  - Firecrawl API
  - OpenRouter API
  - Webview containers

  License

  MIT
  ```
