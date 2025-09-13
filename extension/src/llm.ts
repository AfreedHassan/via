export type LLMResult = { rawText: string };

export function getOpenAIClient(apiKey: string) {
    throw new Error('OpenAI not configured');
}

export async function generateUI(openaiOrNull: any, model: string, prompt: string, imageUrls: string[], sequentialTools = true, provider: 'openai' | 'openrouter' = 'openrouter', openrouterKey?: string): Promise<LLMResult> {
    throw new Error('LLM generation not configured');
}