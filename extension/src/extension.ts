// fix the import error for vscode
import * as vscode from 'vscode';
import * as path from 'path';
import { SidebarViewProvider } from './SidebarViewProvider';
import * as dotenv from 'dotenv';
import { LocalAdapter } from './storage.local';
import { StorageAdapter } from './storage';
import { getShots } from './firecrawl';
import { GalleryPanel } from './galleryPanel';
import { getOpenAIClient, generateUI } from './llm';
import { writeOutput } from './writer';

export async function activate(context: vscode.ExtensionContext) {
  // Load environment variables from root directory
  const rootEnvPath = path.join(__dirname, '..', '..', '.env');
  try {
    dotenv.config({ path: rootEnvPath });
  } catch (err) {
    console.error('Failed to load .env file:', err);
  }
	try { dotenv.config(); } catch { /* ignore */ }
	// hydrate secrets from env if present
	const envPairs: Array<[string, string | undefined]> = [
		['via.firecrawlApiKey', process.env.FIRECRAWL_API_KEY],
		['via.openaiApiKey', process.env.OPENAI_API_KEY],
	];
	context.secrets.get('via.firecrawlApiKey').then(async existing => {
		if (!existing && envPairs[0][1]) { await context.secrets.store(envPairs[0][0], envPairs[0][1] as string); }
	});
	context.secrets.get('via.openaiApiKey').then(async existing => {
		if (!existing && envPairs[1][1]) { await context.secrets.store(envPairs[1][0], envPairs[1][1] as string); }
	});

    // Register our custom webview provider
    const sidebarViewProvider = new SidebarViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarViewProvider.viewType,
            sidebarViewProvider
        )
    );

    // Register preview update command
    context.subscriptions.push(
        vscode.commands.registerCommand('via.updatePreview', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const code = editor.document.getText();
                await sidebarViewProvider.updatePreview(code);
            } else {
                vscode.window.showInformationMessage('Open a file to preview');
            }
        })
    );

    // Register inline completion provider for .txt files
    const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**/*.txt' },
        {
            provideInlineCompletionItems: async (document, position, context, token) => {
                const line = document.lineAt(position).text;
                const prefix = line.substring(0, position.character);

                if (prefix.trim().toLowerCase() === "hello world") {
                    // Find the start of "hello world" in the line
                    const helloWorldStart = line.toLowerCase().indexOf("hello world");
                    const start = new vscode.Position(position.line, helloWorldStart);
                    const end = new vscode.Position(position.line, helloWorldStart + "hello world".length);

                    return {
                        items: [
                            {
                                insertText: "hello via",
                                range: new vscode.Range(start, end)
                            }
                        ]
                    };
                }

                return { items: [] };            }
        }
    );

    context.subscriptions.push(inlineCompletionProvider);

    // VIA main command
    context.subscriptions.push(vscode.commands.registerCommand('via.inspireAndDesign', async () => {
        try {
            const cfg = vscode.workspace.getConfiguration('via');
            const firecrawlKeyCfg = cfg.get<string>('firecrawlApiKey') || '';
            const firecrawlKeySecret = await context.secrets.get('via.firecrawlApiKey') || '';
            const firecrawlKey = firecrawlKeySecret || firecrawlKeyCfg;
            if (!firecrawlKey) {
                vscode.window.showErrorMessage('Set Firecrawl API key via command: VIA: Set Firecrawl API Key');
                return;
            }

            const prompt = await vscode.window.showInputBox({ prompt: 'Describe the landing you want (e.g., fintech dark hero + metrics + CTA)' });
            if (!prompt) { return; }

            const shots = await getShots(firecrawlKey, prompt);
            const gallery = new GalleryPanel(context.extensionUri);
            gallery.show(shots, prompt, async (message) => {
                if (message?.type === 'generate') {
                    const ids: string[] = message.ids || [];
                    const selection = shots.filter(s => ids.includes(s.sourceUrl));
                    if (!selection.length) {
                        vscode.window.showWarningMessage('Select at least one inspiration image.');
                        return;
                    }

                    const model = cfg.get<string>('llm.model') || 'z-ai/glm-4.5-air:free';
                    const provider = (cfg.get<string>('llm.provider') as 'openrouter' | 'openai') || 'openrouter';
                    const sequential = vscode.workspace.getConfiguration('via').get<boolean>('agentSequentialTools') !== false;
                    let resultText = '';
                    if (provider === 'openrouter') {
                        const orKey = await context.secrets.get('via.openrouterApiKey') || process.env.OPENROUTER_API_KEY || '';
                        if (!orKey) {
                            vscode.window.showErrorMessage('Set OpenRouter API key via command: VIA: Set OpenRouter API Key or .env OPENROUTER_API_KEY');
                            return;
                        }
                        const res = await generateUI(null, model, message.prompt || prompt, selection.map(s => s.fullUrl), sequential, 'openrouter', orKey);
                        resultText = res.rawText;
                    } else {
                        const openaiKey = await context.secrets.get('via.openaiApiKey') || process.env.OPENAI_API_KEY || '';
                        if (!openaiKey) {
                            vscode.window.showErrorMessage('Set OpenAI API key via command: VIA: Set OpenAI API Key');
                            return;
                        }
                        const client = getOpenAIClient(openaiKey);
                        const res = await generateUI(client, model, message.prompt || prompt, selection.map(s => s.fullUrl), sequential, 'openai');
                        resultText = res.rawText;
                    }
                    const result = { rawText: resultText };
                    // Try to show in the sidebar preview if HTML is present
                    const htmlForPreview = (resultText.match(/```html[\r\n]+([\s\S]*?)```/i)?.[1] || '').trim();
                    if (htmlForPreview) {
                        try { await sidebarViewProvider.updatePreview(htmlForPreview); } catch { /* noop */ }
                    }
                    await writeOutput(message.prompt || prompt, result.rawText);

                    // storage record (local only for v1)
                    const store = getStorage(context);
                    await store.init();
                    const project = (await store.listProjects())[0] || await store.createProject('My VIA Project');
                    await store.saveInspiration(project.id, prompt, selection);
                    await store.saveGeneration({
                        id: String(Date.now()),
                        projectId: project.id,
                        prompt: message.prompt || prompt,
                        model,
                        outputTsx: result.rawText,
                        styleGuide: undefined,
                        createdAt: new Date().toISOString(),
                        refs: selection
                    });
                }
            });
        } catch (err: any) {
            vscode.window.showErrorMessage(`VIA error: ${err?.message || String(err)}`);
        }
    }));

    // Secret storage commands
    context.subscriptions.push(vscode.commands.registerCommand('via.setOpenAIKey', async () => {
        const key = await vscode.window.showInputBox({ 
            prompt: 'Enter OpenAI API key (starts with sk-...)',
            password: true,
            placeHolder: 'sk-...',
            validateInput: text => {
                return text.startsWith('sk-') ? null : 'OpenAI API key should start with sk-';
            }
        });
        if (!key) { return; }
        await context.secrets.store('via.openaiApiKey', key);
        vscode.window.showInformationMessage('OpenAI key saved to Secret Storage.');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('via.setFirecrawlKey', async () => {
        const key = await vscode.window.showInputBox({ prompt: 'Enter Firecrawl API key', password: true });
        if (!key) { return; }
        await context.secrets.store('via.firecrawlApiKey', key);
        vscode.window.showInformationMessage('Firecrawl key saved to Secret Storage.');
    }));

    // Open last results folder
    context.subscriptions.push(vscode.commands.registerCommand('via.openResultsFolder', async () => {
        const last = await vscode.commands.executeCommand<string>('getContext', 'via.lastResultsFolder');
        if (!last) {
            vscode.window.showInformationMessage('No results folder yet. Generate first.');
            return;
        }
        const uri = vscode.Uri.file(last);
        vscode.commands.executeCommand('revealFileInOS', uri);
    }));
}

export function deactivate() { }

function getStorage(context: vscode.ExtensionContext): StorageAdapter {
    const cfg = vscode.workspace.getConfiguration('via');
    const mode = cfg.get<string>('storage') || 'local';
    // Supabase path deferred in v1
    return new LocalAdapter(context);
}
