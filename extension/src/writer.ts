import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export type WrittenPaths = { folder: string; styleGuideMd?: string; styleGuideJson?: string; mainComponent?: string };

export async function writeOutput(prompt: string, raw: string): Promise<WrittenPaths> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    const dir = path.join(root, 'via_output', String(Date.now()));
    fs.mkdirSync(dir, { recursive: true });

    // naive parsing: extract first fenced JSON and TSX blocks if present
    const jsonMatch = raw.match(/```json[\r\n]+([\s\S]*?)```/i);
    const tsxMatch = raw.match(/```tsx[\r\n]+([\s\S]*?)```/i);
    const styleJson = jsonMatch ? jsonMatch[1].trim() : '{}';
    const tsxCode = tsxMatch ? tsxMatch[1].trim() : raw;

    const mdPath = path.join(dir, 'STYLE_GUIDE.md');
    const jsonPath = path.join(dir, 'style-guide.json');
    const tsxPath = path.join(dir, 'code', 'GeneratedLanding.tsx');
    fs.mkdirSync(path.dirname(tsxPath), { recursive: true });

    fs.writeFileSync(mdPath, `# Style Guide\n\nPrompt:\n\n> ${prompt}\n\n---\n\n${raw}`);
    fs.writeFileSync(jsonPath, styleJson);
    fs.writeFileSync(tsxPath, tsxCode);

    const openDoc = async (p: string) => {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p));
        await vscode.window.showTextDocument(doc, { preview: false });
    };
    await openDoc(mdPath);
    await openDoc(tsxPath);

    // remember last results folder
    await vscode.commands.executeCommand('setContext', 'via.lastResultsFolder', dir);

    return { folder: dir, styleGuideMd: mdPath, styleGuideJson: jsonPath, mainComponent: tsxPath };
}


