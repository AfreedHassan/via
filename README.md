# Via - VS Code Extension

This is a template for creating VS Code extensions. It provides a basic structure and example implementation to help you get started with extension development.

## Features

Currently includes:
- Basic extension setup with TypeScript
- Example "Hello World" command implementation
- Standard VS Code extension project structure

## Requirements

- VS Code 1.85.0 or higher
- Node.js

## Getting Started

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press F5 to open a new window with your extension loaded
4. Run the command "Hello World" from the Command Palette (Ctrl+Shift+P)
5. You should see a "Hello World from Via!" message

## Development

- Run `npm run watch` to compile the extension and watch for file changes
- Run `npm run test` to run the test suite
- The entry point of the extension is `src/extension.ts`
- Package.json's `contributes` section declares the extension's entry points

## Building and Publishing

1. Update version in package.json
2. Run `vsce package` to create a VSIX file
3. Publish to the VS Code Marketplace using `vsce publish`

## Extension Settings

This extension contributes the following settings:
* None yet - customize this section as you add settings

## Release Notes

### 0.0.1

Initial release of Via
- Basic extension template
- Hello World command implementation

## License

This project is licensed under the MIT License - see the LICENSE file for details