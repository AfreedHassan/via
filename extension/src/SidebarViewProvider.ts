import * as vscode from 'vscode';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'helloWorldPreview';

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        // Set fixed dimensions
        const bgUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "background.png"));

        // Set webview options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            // enableFindWidget: false, // Disable find widget to save space
        };

        // Set initial size
        const smallSize = { width: 100, height: 100 };
        if ('setSize' in webviewView) {
            (webviewView as any).setSize(smallSize.width, smallSize.height);
        }

        // Initial render
        this._updateWebview(webviewView);

        // Handle webview resizing
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // Try to enforce size again when visibility changes
                if ('setSize' in webviewView) {
                    (webviewView as any).setSize(smallSize.width, smallSize.height);
                }
                const bgUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "background.png"));
                webviewView.webview.html = this._getHtmlContent(bgUri);
            }
        });
    }

    private _updateWebview(webviewView: vscode.WebviewView) {
        if (!webviewView.visible) {
            return;
        }

        const bgUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "background.png"));
        webviewView.webview.html = this._getHtmlContent(bgUri);

        // Set up message handler only once
        if (!this._messageHandlerSet) {
            this._messageHandlerSet = true;
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
    }

    private _messageHandlerSet: boolean = false;

    private _getHtmlContent(bgUri?: vscode.Uri): string {
        return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=100%, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap" rel="stylesheet">
  <title>Hello World Preview</title>
  <style>
    :root {
      --preview-height: 500px;
      --light-blue: #6B88FF;
      --dark-blue: #0E204E;
    }

    html,
    body {
      width: 100%;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    body {
      color: black;
      font-family: 'Pixelify Sans', var(--vscode-font-family);
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      padding: 12px;
      box-sizing: border-box;
      background: linear-gradient(135deg, var(--dark-blue) 0%, var(--light-blue) 100%);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      min-height: 100vh;
      background-color: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(5px);
    }

    .preview-container {
      width: 90%;
      height: 40%;
      aspect-ratio: 9/16;

      /* Standard webview ratio */
      max-height: calc(var(--preview-height) - 16px);

      /* Account for body padding */
      border: 20px solid var(--dark-blue);
      border-radius: 20px;
      padding: 16px;
      box-sizing: border-box;
      background-color: white;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0 auto;
      margin-top: 20px;
    }
    
    .description {
      color: var(--dark-blue);
      font-size: 14px;
      margin: auto; 
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
      background-color: var(--light-blue);
      height: 40px;
      width: 60%;
      color: var(--vscode-button-foreground);
      font-family: 'Pixelify Sans', var(--vscode-font-family);
      border: none;
      margin: 10px auto;
      padding: 4px 8px;
      border-radius: 15px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    .flex-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
    }
    .outer-container {
      background-color: rgba(14, 32, 78, 0.9); /* var(--dark-blue) with opacity */
      display: flex;
      flex-direction: column;
      width: 90%;
      height: 40%;
      border-radius: 20px;
      padding: 20px;
      box-sizing: border-box;
      margin: 0 auto;
      margin-top: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .inner-container {
      background-color: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      height: 100%;
      border-radius: 12px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }
  </style>
</head>

<body width="100px">
<div class="flex-container">
  <div class="outer-container">
    <div class="inner-container">
        <p class="description">describe what you are building...</p>
    </div>
  </div>
  <button class="button" onclick="handleButtonClick()">Peak Style!</button>
  <div style="border-radius: 0px; " class="outer-container">
    <div style="border-radius: 0px; margin-top: 30px" class="inner-container">
        <p class="description"></p>
    </div>
  </div>
<div>
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
