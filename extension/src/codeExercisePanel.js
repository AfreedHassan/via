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
exports.CodeExercisePanel = void 0;
const vscode = __importStar(require("vscode"));
class CodeExercisePanel {
    static createOrShow(extensionUri, currentCode, exerciseCode, title) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it
        if (CodeExercisePanel.currentPanel) {
            CodeExercisePanel.currentPanel._panel.reveal(column);
            CodeExercisePanel.currentPanel._update(currentCode, exerciseCode, title);
            return;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel('codeExercise', 'Code Exercise', column || vscode.ViewColumn.One, {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the `media` directory
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        });
        CodeExercisePanel.currentPanel = new CodeExercisePanel(panel, extensionUri, currentCode, exerciseCode, title);
    }
    constructor(panel, extensionUri, currentCode, exerciseCode, title) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update(currentCode, exerciseCode, title);
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'applyExercise':
                    // Apply the exercise code to the current editor
                    if (vscode.window.activeTextEditor) {
                        const document = vscode.window.activeTextEditor.document;
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), message.code);
                        vscode.workspace.applyEdit(edit);
                    }
                    return;
            }
        }, null, this._disposables);
    }
    _update(currentCode, exerciseCode, title) {
        this._panel.title = title;
        this._panel.webview.html = this._getHtmlForWebview(currentCode, exerciseCode, title);
    }
    _getHtmlForWebview(currentCode, exerciseCode, title) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                }
                .container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 20px;
                }
                .code-section {
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 15px;
                }
                .code-content {
                    font-family: 'Courier New', Courier, monospace;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }
                h2 {
                    color: var(--vscode-editor-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <div class="container">
                <div class="code-section">
                    <h2>Current Code</h2>
                    <div class="code-content">${this._escapeHtml(currentCode)}</div>
                </div>
                <div class="code-section">
                    <h2>Exercise</h2>
                    <div class="code-content">${this._escapeHtml(exerciseCode)}</div>
                    <button class="button" onclick="applyExercise()">Apply Exercise Code</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                
                function applyExercise() {
                    const exerciseCode = document.querySelector('.code-section:nth-child(2) .code-content').textContent;
                    vscode.postMessage({
                        command: 'applyExercise',
                        code: exerciseCode
                    });
                }
            </script>
        </body>
        </html>`;
    }
    _escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    dispose() {
        CodeExercisePanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.CodeExercisePanel = CodeExercisePanel;
//# sourceMappingURL=codeExercisePanel.js.map