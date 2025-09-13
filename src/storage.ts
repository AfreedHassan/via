export type InspirationShot = {
    id: string;
    title: string;
    thumbUrl: string;
    fullUrl: string;
    sourceUrl: string;
    author?: string;
};

export type Generation = {
    id: string;
    projectId: string;
    prompt: string;
    model: string;
    outputTsx: string;
    styleGuide?: any;
    createdAt: string;
    refs: InspirationShot[];
};

export interface StorageAdapter {
    init(): Promise<void>;
    createProject(name: string): Promise<{ id: string; name: string }>;
    listProjects(): Promise<{ id: string; name: string }[]>;
    saveInspiration(projectId: string, query: string, shots: InspirationShot[]): Promise<string>;
    saveGeneration(gen: Generation): Promise<void>;
    listGenerations(projectId: string, limit?: number): Promise<Generation[]>;
}


