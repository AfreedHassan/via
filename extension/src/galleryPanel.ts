import * as vscode from 'vscode';
import { Shot } from './firecrawl';

export class GalleryPanel {
    public static readonly viewType = 'via.gallery';
    private panel: vscode.WebviewPanel | undefined;

    constructor(private readonly extensionUri: vscode.Uri) { }

    show(shots: Shot[], initialPrompt: string, onMessage: (msg: any) => void) {
        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                GalleryPanel.viewType,
                'VIA Gallery',
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    localResourceRoots: [this.extensionUri],
                }
            );
            this.panel.onDidDispose(() => this.panel = undefined);
            this.panel.webview.onDidReceiveMessage(onMessage);
        }
        const nonce = String(Math.random()).slice(2);
        this.panel.webview.html = this.renderHtml(this.panel.webview, shots, initialPrompt, nonce);
        this.panel.reveal();
    }

    private renderHtml(webview: vscode.Webview, shots: Shot[], prompt: string, nonce: string) {
        const cards = shots.map(s => `
        <label class="card">
            <input type="checkbox" value="${s.sourceUrl}" />
            <img src="${s.thumbUrl}" alt="${escapeHtml(s.title)}"/>
            <div class="meta">
                <a href="${s.sourceUrl}" target="_blank" rel="noreferrer">${escapeHtml(s.title)}</a>
            </div>
        </label>`).join('');

        return `<!doctype html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
body { font-family: var(--vscode-font-family); padding: 8px; }
.bar { display: flex; gap: 8px; margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
.card { display: block; border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 6px; }
.card img { width: 100%; height: 120px; object-fit: cover; border-radius: 4px; }
.meta { margin-top: 4px; font-size: 12px; }
button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 0; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
.tos { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
</style>
</head>
<body>
 <div class="bar">
   <input id="prompt" style="flex:1;" value="${escapeHtml(prompt)}" placeholder="Describe the landing you want..."/>
   <button id="gen">Generate</button>
 </div>
 <div class="tos">Images are fetched via Firecrawl from Dribbble for inspiration only. Respect rights and terms; do not redistribute.</div>
 <div class="grid">${cards}</div>
 <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  document.getElementById('gen').onclick = () => {
    const ids = Array.from(document.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.value);
    const prompt = /** @type {HTMLInputElement} */(document.getElementById('prompt')).value;
    vscode.postMessage({ type: 'generate', ids, prompt });
  };
 </script>
</body>
</html>`;
    }
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"]+/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}


