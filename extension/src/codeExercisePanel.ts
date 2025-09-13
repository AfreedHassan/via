import * as vscode from 'vscode';

export class CodeExercisePanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: CodeExercisePanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(
        extensionUri: vscode.Uri,
        currentCode: string,
        exerciseCode: string,
        title: string
    ) {
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
        const panel = vscode.window.createWebviewPanel(
            'codeExercise',
            'Code Exercise',
            column || vscode.ViewColumn.One,
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from the `media` directory
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        CodeExercisePanel.currentPanel = new CodeExercisePanel(panel, extensionUri, currentCode, exerciseCode, title);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        currentCode: string,
        exerciseCode: string,
        title: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(currentCode, exerciseCode, title);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'applyExercise':
                        // Apply the exercise code to the current editor
                        if (vscode.window.activeTextEditor) {
                            const document = vscode.window.activeTextEditor.document;
                            const edit = new vscode.WorkspaceEdit();
                            edit.replace(
                                document.uri,
                                new vscode.Range(
                                    document.positionAt(0),
                                    document.positionAt(document.getText().length)
                                ),
                                message.code
                            );
                            vscode.workspace.applyEdit(edit);
                        }
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private _update(currentCode: string, exerciseCode: string, title: string) {
        this._panel.title = title;
        this._panel.webview.html = this._getHtmlForWebview(currentCode, exerciseCode, title);
    }

    private _getHtmlForWebview(currentCode: string, exerciseCode: string, title: string): string {
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

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    public dispose() {
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