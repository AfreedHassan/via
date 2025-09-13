"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloWorldProvider = void 0;
const vscode = __importStar(require("vscode"));
class HelloWorldProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        // Set fixed dimensions
        webviewView.description = "100x100 Preview";
        webviewView.title = "Mini Preview";
        // Set webview options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            // enableFindWidget: false, // Disable find widget to save space
        };
        // Set initial size
        const smallSize = { width: 100, height: 100 };
        if ('setSize' in webviewView) {
            webviewView.setSize(smallSize.width, smallSize.height);
        }
        // Initial render
        this._updateWebview(webviewView);
        // Handle webview resizing
        webviewView.onDidChangeVisibility(() => {
            // Try to enforce size again when visibility changes
            if ('setSize' in webviewView) {
                webviewView.setSize(smallSize.width, smallSize.height);
            }
            this._updateWebview(webviewView);
        });
    }
    _updateWebview(webviewView) {
        if (webviewView.visible) {
            webviewView.webview.html = this._getHtmlContent();
        }
        // Set the HTML content
        webviewView.webview.html = this._getHtmlContent();
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'showAlert':
                    vscode.window.showInformationMessage('Button clicked!');
                    return;
            }
        });
    }
    _getHtmlContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=100%, initial-scale=1.0">
            <title>Hello World Preview</title>
            <style>
                :root {
                    --preview-height: 500px;
                }

                html, body {
                    width: 100%;
                    height: var(--preview-height);
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
                
                body {
                    color: black;
                    font-family: var(--vscode-font-family);
                    display: flex;
                    justify-content: flex-start;
                    align-items: flex-start;
                    padding: 8px;
                    box-sizing: border-box;
                }
                
                .preview-container {
                    width: 100%;
                    aspect-ratio: 9/16; /* Standard webview ratio */
                    max-height: calc(var(--preview-height) - 16px); /* Account for body padding */
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 16px;
                    box-sizing: border-box;
                    background-color: white;
                    overflow: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-right: 16px;
                }
                h1 {
                    color: black;
                    font-size: 14px;
                    margin: 0 0 5px 0;
                }
                p {
                    color: black;
                    font-size: 12px;
                    line-height: 1.2;
                    margin: 0 0 10px 0;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 10px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body width="100px">
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
exports.HelloWorldProvider = HelloWorldProvider;
HelloWorldProvider.viewType = 'helloWorldPreview';
//# sourceMappingURL=helloWorldProvider.js.map