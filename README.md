# Hello World Preview Extension

A VS Code extension that shows a static website preview in the sidebar. The preview includes a simple landing page with a header, paragraph, and interactive button.

## Features

- Dedicated sidebar view with 9:16 aspect ratio for vertical layout
- Responsive static website preview that scales with sidebar width
- Interactive button with click functionality
- VS Code theme-aware styling
- Clean, modern preview container with border and rounded corners

## Development

### Prerequisites

- Node.js
- Visual Studio Code

### Setup and Testing

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Compile the extension:
   ```bash
   npm run compile
   ```

3. Launch the extension:
   - Press F5 to open a new Extension Development Host window
   - In the new window, click the Hello World Preview icon in the activity bar (side bar)
   - The preview panel will open showing the static website

### Testing the Features

1. The preview should show:
   - A header saying "Hello World"
   - A welcome message
   - A styled button
2. Click the button to see an alert message
3. Try resizing the sidebar - the preview should scale responsively
4. The preview should maintain its appearance across different VS Code themes

## Development Tips

- Use `npm run watch` to automatically compile changes
- Press Ctrl+R (Cmd+R on Mac) in the Extension Development Host to reload
- Check the Debug Console for any error messages

## Structure

- `src/extension.ts` - Extension entry point
- `src/helloWorldProvider.ts` - WebView provider implementation
- `.vscode/launch.json` - Debug configuration
- `package.json` - Extension manifest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request