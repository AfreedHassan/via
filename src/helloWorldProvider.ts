import * as vscode from 'vscode';

export class HelloWorldProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'helloWorldPreview';

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        // Set the HTML content
        webviewView.webview.html = this._getHtmlContent();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'showAlert':
                        vscode.window.showInformationMessage('Button clicked!');
                        return;
                }
            }
        );
    }

    private _getHtmlContent(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hello World Preview</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    color: black;
                    font-family: var(--vscode-font-family);
                    width: 100%;
                    height: 100vh;
                }
                .preview-container {
                    width: 100%;
                    min-height: 500px;
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    box-sizing: border-box;
                    background-color: white;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                h1 {
                    color: black;
                    font-size: 24px;
                    margin-bottom: 16px;
                }
                p {
                    color: black;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                <h1>Hello World</h1>
                <p>Welcome to the mini landing page preview inside VS Code!</p>
                <button onclick="handleButtonClick()">Click me!</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                
                function handleButtonClick() {
                    // Send a message to the extension
                    vscode.postMessage({
                        command: 'showAlert'
                    });
                }
            </script>
        </body>
        </html>`;
    }
}