import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { StorageAdapter, InspirationShot, Generation } from './storage';

type DB = {
    projects: { id: string; name: string }[];
    inspirations: { id: string; projectId: string; query: string; shots: InspirationShot[]; createdAt: string }[];
    generations: Generation[];
};

export class LocalAdapter implements StorageAdapter {
    constructor(private context: vscode.ExtensionContext) { }
    private dbPath!: string;
    private db!: DB;

    async init() {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const dir = root ? path.join(root, '.via') : this.context.globalStorageUri.fsPath;
        fs.mkdirSync(dir, { recursive: true });
        this.dbPath = path.join(dir, 'history.json');
        if (!fs.existsSync(this.dbPath)) {
            this.db = { projects: [], inspirations: [], generations: [] };
            fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
        } else {
            const raw = fs.readFileSync(this.dbPath, 'utf8') || '{}';
            try {
                this.db = JSON.parse(raw);
            } catch {
                this.db = { projects: [], inspirations: [], generations: [] };
            }
            this.db.projects ??= [];
            this.db.inspirations ??= [];
            this.db.generations ??= [];
        }
    }

    private save() { fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2)); }
    private id(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }

    async createProject(name: string) {
        const p = { id: this.id('proj'), name };
        this.db.projects.push(p);
        this.save();
        return p;
    }

    async listProjects() { return this.db.projects; }

    async saveInspiration(projectId: string, query: string, shots: InspirationShot[]) {
        const rec = { id: this.id('insp'), projectId, query, shots, createdAt: new Date().toISOString() };
        this.db.inspirations.push(rec);
        this.save();
        return rec.id;
    }

    async saveGeneration(gen: Generation) {
        this.db.generations.push(gen);
        this.save();
    }

    async listGenerations(projectId: string, limit = 20) {
        return this.db.generations
            .filter(g => g.projectId === projectId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, limit);
    }
}


