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
    
    // Set webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    // Initial render
    this._updateWebview(webviewView);

    // Handle webview resizing
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && !webviewView.webview.html) {
        webviewView.webview.html = this._getHtmlContent();
      }
    });
  }

  private _updateWebview(webviewView: vscode.WebviewView) {
    if (!webviewView.visible) {
      return;
    }

    webviewView.webview.html = this._getHtmlContent();

    // Set up message handler only once
    if (!this._messageHandlerSet) {
      this._messageHandlerSet = true;
      webviewView.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'generateCode':
              this.handleGenerateCode(message.prompt);
              return;
          }
        }
      );
    }
  }

  private async handleGenerateCode(prompt: string) {
    if (!this._view?.visible) return;

    // Show loading message in preview
    await this.updatePreview(`
      import React from 'react';
      import ReactDOM from 'react-dom';

      function App() {
        return (
          <div className="card" style={{
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '24px',
            background: 'var(--gray-100)',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid var(--gray-300)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ 
              margin: 0,
              color: 'var(--gray-500)',
              fontSize: '14px',
              fontWeight: '500'
            }}>Generating code...</p>
          </div>
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    `);

    try {
      // Check for API key
      const apiKey = await this._context.secrets.get('openrouter_api_key');
      if (!apiKey) {
        vscode.commands.executeCommand('via.setOpenRouterKey');
        throw new Error('OpenRouter API key not found. Please enter your API key in the prompt above.');
      }

      console.log('Sending prompt to OpenRouter:', prompt);

      // Call OpenRouter API to generate code
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/yourusername/via',
          'X-Title': 'Via VS Code Extension',
          'OpenRouter-Completion-Model': 'mistralai/mistral-7b-instruct:free'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: 'You are a React UI expert. Create visually appealing components following these rules:\n1. Use ONLY inline styles with double braces: style={{ key: "value" }}\n2. Use className instead of class\n3. Always close JSX tags properly\n4. Use proper quote marks: style={{ color: "blue" }} not style={{ color: \'blue\' }}\n5. No trailing commas in style objects\n6. Include hover effects using onMouseEnter/onMouseLeave\n7. Add subtle animations using transform and opacity\n8. Return ONLY the JSX content wrapped in ```jsx\n9. Focus on clean, valid JSX syntax' },
            { role: 'user', content: `Create a beautifully styled component that shows: ${prompt}. Include animations, hover effects, and a cohesive design. Focus on making it visually appealing.` }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      console.log('OpenRouter API response:', data);

      if (!response.ok) {
        let errorMessage = 'Failed to generate code';
        
        try {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error?.message) {
            errorMessage = data.error.message;
          } else if (data.error) {
            errorMessage = JSON.stringify(data.error);
          } else if (data.message) {
            errorMessage = data.message;
          }
        } catch (e) {
          console.error('Error parsing error message:', e);
        }

        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('Invalid API response:', data);
        throw new Error('Invalid response from OpenRouter API');
      }

      const generatedCode = data.choices[0].message.content;

      // Extract code block from the response
      const codeMatch = generatedCode.match(/```(?:jsx?|tsx?|react)?\n([\s\S]*?)```/);
      if (!codeMatch) {
        throw new Error('No code block found in the response');
      }

      let cleanCode = codeMatch[1].trim();

      // Clean up the code
      cleanCode = cleanCode
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '') // Remove imports
        .replace(/export\s+default\s+/g, '') // Remove exports
        .replace(/"\s*\+\s*"/g, '') // Fix concatenated strings
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

      // Create a basic React component template
      const template = `
import React from 'react';
import * as ReactDOM from 'react-dom/client';

${cleanCode}

// Initialize React
(function() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(MedicinalCard, { 
    medicine: {
      name: "Sample Medicine",
      description: "This is a sample medicine description",
      image: "https://via.placeholder.com/300x200"
    }
  }));
})();`;

      // Update the preview with the generated code
      await this.updatePreview(template);

      // Re-enable the input
      this._view.webview.postMessage({
        command: 'promptComplete'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err, null, 2);
      console.error('Failed to generate code:', err);
      vscode.window.showErrorMessage(`Failed to generate code: ${errorMessage}`);

      // Show error in preview
      await this.updatePreview(`
        import React from 'react';
        import * as ReactDOM from 'react-dom/client';

        function App() {
          return (
            <div style={{ 
              padding: '20px',
              fontFamily: 'system-ui',
              color: '#e74c3c',
              background: '#fef9f9',
              borderRadius: '8px',
              border: '1px solid #fadbd9',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
              <p style={{ margin: 0 }}>${JSON.stringify(err, null, 2)}</p>
            </div>
          );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      `);

      // Re-enable the input on error
      this._view.webview.postMessage({
        command: 'promptComplete'
      });
    }
  }

  public async updatePreview(reactCode: string) {
    if (this._view?.visible) {
      try {
        const response = await fetch('http://localhost:3001/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            framework: 'react',
            code: reactCode
          })
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
        }

        this._view.webview.postMessage({
          command: 'updatePreview',
          html: data.html
        });
      } catch (err) {
        console.error('Failed to update preview:', err);
      }
    }
  }

  private _getHtmlContent(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=100%, initial-scale=1.0">
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
      backdrop-filter: blur(5px);
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
      display: flex;
      align-items: stretch;
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
        <input type="text" id="prompt" placeholder="Describe what you are building...">
      </div>
    </div>
    <button class="button" onclick="handlePromptSubmit()">Generate Component</button>
    <div class="preview-container-top">
      <p style="color: white; margin: auto 0;">preview:</p>
    </div>
    <div class="preview-container-lower-layer">  
      <div class="preview-container-upper-layer">
        <iframe 
          id="previewFrame"
          sandbox="allow-scripts"
          style="
            width: 100%;
            height: 100%;
            border: none;
            overflow: hidden;
            display: block;
            box-sizing: border-box;
          "
        ></iframe>
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

    function updatePreview(html) {
      try {
        const frame = document.getElementById('previewFrame');
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        frame.onload = () => {
          URL.revokeObjectURL(url);
        };
        
        frame.src = url;
      } catch (err) {
        console.error('Failed to update preview:', err);
      }
    }

    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.command) {
        case 'updatePreview':
          updatePreview(message.html);
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