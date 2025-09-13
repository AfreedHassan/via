import OpenAI from 'openai';
import * as https from 'https';

export type LLMResult = { rawText: string };

export function getOpenAIClient(apiKey: string) {
    return new OpenAI({ apiKey });
}

export async function generateUI(openaiOrNull: OpenAI | null, model: string, prompt: string, imageUrls: string[], sequentialTools = true, provider: 'openai' | 'openrouter' = 'openrouter', openrouterKey?: string): Promise<LLMResult> {
    const system = sequentialTools
        ? `You are VIA, a design+code agent that uses tools sequentially. Tools you have access to (already executed by the host):
1) Firecrawl.searchDribbble(query): returns a list of Dribbble shot pages (via search), no Dribbble API.
2) Firecrawl.scrape(url): resolves best image URL from a shot page.
You will be given a prompt and a small set of resolved image URLs. Do not attempt to call tools yourself; assume they have already been executed in order.
Your job: produce (a) a compact style-tokens JSON (colors, typography, spacing); (b) React+Tailwind components for a landing page; (c) a short rationale. Output must contain one fenced JSON block and one fenced TSX block.`
        : `You are a senior product designer + UI engineer. Deliver: (1) concise style tokens JSON; (2) React+Tailwind components for landing; (3) short rationale. Output must include a top-level fenced JSON block for tokens and a fenced TSX block for components.`;

    // OpenRouter: use Chat Completions compatible API
    if (provider === 'openrouter') {
        if (!openrouterKey) { throw new Error('OpenRouter API key missing'); }
        const messages: any[] = [
            { role: 'system', content: system },
            { role: 'user', content: [
                { type: 'text', text: `Prompt: ${prompt}` },
                ...imageUrls.slice(0, 6).map(u => ({ type: 'image_url', image_url: { url: u } }))
            ]}
        ];
        const body = JSON.stringify({ model, messages, temperature: 0.3 });
        const text = await httpPostJson('https://openrouter.ai/api/v1/chat/completions', body, {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'via-extension',
            'X-Title': 'VIA'
        });
        return { rawText: text };
    }

    // Default OpenAI Responses API path
    const content: any[] = [
        { type: 'input_text', text: system },
        { type: 'input_text', text: `Prompt: ${prompt}` },
        ...imageUrls.slice(0, 6).map(u => ({ type: 'input_image', image_url: u }))
    ];
    const resp: any = await (openaiOrNull as any).responses.create({ model, input: [{ role: 'user', content }] });
    const text: string = resp?.output_text || '';
    return { rawText: text };
}

async function httpPostJson(url: string, body: string, headers: Record<string, string>): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8');
                try {
                    const json = JSON.parse(raw);
                    const text = json?.choices?.[0]?.message?.content || raw;
                    resolve(text);
                } catch {
                    resolve(raw);
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}


