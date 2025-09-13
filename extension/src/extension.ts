// fix the import error for vscode
import * as vscode from 'vscode';
import { HelloWorldProvider } from './helloWorldProvider';

export function activate(context: vscode.ExtensionContext) {
    // Register our custom webview provider
    const helloWorldProvider = new HelloWorldProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            HelloWorldProvider.viewType,
            helloWorldProvider
        )
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
}

export function deactivate() { }
