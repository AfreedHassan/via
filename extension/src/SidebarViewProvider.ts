import * as vscode from 'vscode';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'helloWorldPreview';
  private _view?: vscode.WebviewView;
  private _messageHandlerSet: boolean = false;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    this._updateWebview(webviewView);

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && !webviewView.webview.html) {
        webviewView.webview.html = this._getHtmlContent();
      }
    });
  }

  private _updateWebview(webviewView: vscode.WebviewView) {
    if (!webviewView.visible) return;

    webviewView.webview.html = this._getHtmlContent();

    if (!this._messageHandlerSet) {
      this._messageHandlerSet = true;
      webviewView.webview.onDidReceiveMessage(message => {
        if (message.command === 'generateCode') {
          this.handleGenerateCode(message.prompt);
        }
      });
    }
  }

  private async handleGenerateCode(prompt: string) {
    if (!this._view?.visible) return;

    // Show loading state
    await this.updatePreview(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: system-ui;
            background: #f7f9fc;
          }
          .loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .spinner {
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            border: 0.2rem solid #e4e9f2;
            border-top-color: #6b88ff;
            animation: spin 1s linear infinite;
          }
          .text {
            color: #8f9bb3;
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <p class="text">Generating website...</p>
        </div>
      </body>
      </html>
    `);

    try {
      const apiKey = await this._context.secrets.get('via.openaiApiKey');
      if (!apiKey) {
        vscode.commands.executeCommand('via.setOpenAIKey');
        throw new Error('OpenAI API key not found. Please enter your API key.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { 
              role: 'system', 
              content: 'You are a web design expert. Create a complete website/page following these EXACT rules:\n\n1. Use modern HTML5 semantic elements (header, nav, main, section, footer, etc.)\n2. Write clean, well-structured HTML\n3. Include CSS in a <style> tag in the head\n4. Use modern CSS features (flexbox, grid, custom properties, etc.)\n5. Make it responsive and mobile-friendly\n6. Include hover effects and smooth transitions\n7. Use a modern, clean design aesthetic\n8. Include proper meta tags and viewport settings\n9. Use semantic class names\n10. Include comments for major sections\n11. Ensure all interactive elements are properly styled\n12. Use web-safe fonts or link to Google Fonts\n13. Include proper spacing and visual hierarchy\n14. Optimize for accessibility\n15. CRITICAL: Return ONLY the complete HTML document with embedded CSS\n16. CRITICAL: Do not include any external JavaScript\n17. CRITICAL: Use only relative units (rem, em, %, vh, vw) for better responsiveness' 
            },
            { 
              role: 'user', 
              content: `Create a complete website/page that displays: ${prompt}. Make it a full page layout with multiple sections, beautiful design, and modern styling.` 
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Failed to generate code';
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI API');
      }

      const generatedCode = data.choices[0].message.content;
      console.log('Generated code from AI:', generatedCode);

      // The response might still come wrapped in code blocks, let's handle both cases
      let cleanCode = generatedCode.trim();
      const htmlMatch = cleanCode.match(/```(?:html)?\n?([\s\S]*?)```/);
      if (htmlMatch) {
        cleanCode = htmlMatch[1].trim();
      }
      console.log('Clean code to be rendered:', cleanCode);

      // Update the preview with the generated code
      await this.updatePreview(cleanCode);

      // Re-enable the input
      this._view.webview.postMessage({ command: 'promptComplete' });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Failed to generate code:', err);
      vscode.window.showErrorMessage(`Failed to generate code: ${errorMessage}`);

      // Show error in preview
      await this.updatePreview(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 1.25rem;
              font-family: system-ui;
              color: #e74c3c;
              background: #fef9f9;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              text-align: center;
            }
            .error-container {
              max-width: 30rem;
              padding: 1.25rem;
              border-radius: 0.5rem;
              border: 1px solid #fadbd9;
            }
            h3 { margin: 0 0 0.625rem 0; }
            p { margin: 0; font-size: 0.875rem; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h3>Error</h3>
            <p>${errorMessage}</p>
          </div>
        </body>
        </html>
      `);

      // Re-enable the input on error
      this._view.webview.postMessage({ command: 'promptComplete' });
    }
  }

  public async updatePreview(htmlCode: string) {
    if (!this._view?.visible) return;

    try {
      // Send the HTML directly to the webview
      this._view.webview.postMessage({
        command: 'updatePreview',
        html: htmlCode
      });
    } catch (err) {
      console.error('Failed to update preview:', err);
      this._view.webview.postMessage({
        command: 'updatePreview',
        html: null,
        error: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }

  private _getHtmlContent(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap" rel="stylesheet">
  <title>Via Preview</title>
  <style>
    :root {
      --preview-height: 500px;
      --light-blue: #6B88FF;
      --dark-blue: #0E204E;
    }

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    body {
      color: black;
      font-family: 'Pixelify Sans', var(--vscode-font-family);
      display: flex;
      flex-direction: column;
      padding: 12px;
      box-sizing: border-box;
      background: linear-gradient(135deg, var(--dark-blue) 0%, var(--light-blue) 100%);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.05);
    }

    .flex-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .outer-container {
      background-color: rgba(14, 32, 78, 0.9);
      display: flex;
      flex-direction: column;
      width: 90%;
      height: 20%;
      border-radius: 20px;
      padding: 20px;
      box-sizing: border-box;
      margin: 0 auto;
      margin-top: 20px;
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

    .preview-container-top {
      width: 80%;
      height: 5%;
      max-height: calc(var(--preview-height) - 16px);
      box-sizing: border-box;
      background-color: var(--dark-blue);
      color: white;
      align-items: center;
      overflow: auto;
      display: flex;
      font-size: 16px;
      flex-direction: column;
      margin: 0 auto;
      margin-top: 20px;
    }

    .preview-container-lower-layer {
      background-color: var(--dark-blue);
      width: 80%;  
      height: 50%;
      margin: 0 auto;
    }
    
    .preview-container-upper-layer {
      background-color: white;
      width: 90%;  
      height: 95%;
      margin: 0 auto;
      overflow: hidden;
      position: relative;
      display: block;
    }

    .preview-button-container {
      background-color: var(--dark-blue);
      width: 80%;  
      height: 15%;
      margin: 0 auto;
      gap: 10px;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      padding: 0 10%;
    }

    .preview-button {
      background-color: var(--light-blue);
      height: 30px;
      width: 60%;
      color: var(--vscode-button-foreground);
      font-family: 'Pixelify Sans', var(--vscode-font-family);
      border: none;
      margin: auto;
      padding: 4px 8px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 12px;
    }

    .preview-button:hover {
      background-color: var(--light-blue);
      color: white;
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
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    input {
      border: none;
      width: 100%;
      padding: 8px;
    }
  </style>
</head>
<body>
  <div class="flex-container">
    <div class="outer-container">
      <div class="inner-container">
        <input type="text" id="prompt" placeholder="Describe the website/page you want to create...">
      </div>
    </div>
    <button class="button" onclick="handlePromptSubmit()">Generate Website</button>
    <div class="preview-container-top">
      <p style="color: white; margin: auto 0;">preview:</p>
    </div>
    <div class="preview-container-lower-layer">  
      <div class="preview-container-upper-layer">
        <iframe id="previewFrame" style="width: 100%; height: 100%; border: none; background: white; transform-origin: 0 0;" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>
      <div class="preview-button-container">
        <button class="preview-button">apply</button>
        <button class="preview-button">request</button>
      </div>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    async function handlePromptSubmit() {
      try {
        const promptInput = document.getElementById('prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
          console.error('No prompt provided');
          return;
        }

        // Disable input and button while processing
        promptInput.disabled = true;
        promptInput.style.opacity = '0.7';
        
        vscode.postMessage({
          command: 'generateCode',
          prompt: prompt
        });
      } catch (err) {
        console.error('Failed to submit prompt:', err);
      }
    }

    function updatePreview(html, error) {
      try {
        console.log('updatePreview called with:', { 
          hasHtml: !!html, 
          htmlContent: html ? html.substring(0, 100) + '...' : null,
          error 
        });
        const iframe = document.getElementById('previewFrame');
        if (!iframe) {
          console.error('Preview iframe not found');
          return;
        }
        
        if (error) {
          // Show error message in iframe
          const errorHtml = \`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: system-ui;
                  color: #e74c3c;
                  background: #fef9f9;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  text-align: center;
                }
                h3 { margin: 0 0 10px 0; }
                p { margin: 0; font-size: 14px; }
              </style>
            </head>
            <body>
              <h3>Error</h3>
              <p>\${error}</p>
            </body>
            </html>
          \`;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(errorHtml);
          iframeDoc.close();
        } else if (html) {
          // Write the HTML content directly to the iframe
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
        } else {
          // Show empty state
          const emptyHtml = \`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: system-ui;
                  color: #666;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
              </style>
            </head>
            <body>
              No preview available
            </body>
            </html>
          \`;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(emptyHtml);
          iframeDoc.close();
        }
      } catch (err) {
        console.error('Failed to update preview:', err);
      }
    }

    window.addEventListener('message', event => {
      const message = event.data;
      console.log('Received message:', message);
      switch (message.command) {
        case 'updatePreview':
          updatePreview(message.html, message.error);
          break;
        case 'promptComplete':
          const promptInput = document.getElementById('prompt');
          promptInput.disabled = false;
          promptInput.style.opacity = '1';
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}