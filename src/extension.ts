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
}

export function deactivate() {}