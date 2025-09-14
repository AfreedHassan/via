export type LLMResult = { rawText: string };

export function getOpenAIClient(apiKey: string) {
    throw new Error('OpenAI not configured');
}

function buildPrompt(userPrompt: string, imageUrls: string[]) {
    const imagesList = imageUrls.map((u, i) => `- ${u}`).join('\n');
    const sys = `You are a senior product designer and front-end engineer.
Translate the goal and the provided reference images into a polished, responsive UI section.

OUTPUT FORMAT (very important):
- Return ONLY one fenced code block with \`\`\`html ... \`\`\`.
- The code block MUST contain a self-contained SECTION SNIPPET (NOT a full HTML document):
  - Allowed tags in the top level: <style> (optional), then a single <section> root (with any children inside).
  - Do NOT include <html>, <head>, or <body>.
- No explanations or extra Markdown outside the single code block.

IMAGE‑FORWARD REQUIREMENTS:
- Treat the images as the primary inspiration. Use at least one image prominently above the fold (hero), and optionally a small inspiration strip if multiple images are provided.
- Use the provided https image URLs only; do NOT reference any other images or external assets.
- Add meaningful alt text for each image (e.g., describe the UI and its purpose).

DESIGN & CODE CONSTRAINTS:
- Clean, modern visual language; clear hierarchy; strong CTA.
- Inline all CSS in a <style> tag. Prefer CSS variables, flex/grid, and accessible contrast.
- No external scripts, fonts, or frameworks. System fonts only.
- Keep it mobile-first and responsive.
`;
    const user = `Goal: ${userPrompt}
Inspirations (highest priority, use these images):\n${imagesList || '- (none selected)'}

Build a single hero + content section with:
- Headline, subheadline, primary CTA, supporting features/metrics.
- Prominent usage of at least one inspiration image in the hero (banner, masked figure, or side-by-side preview), and optional small thumbnail strip for the rest.
- Palette and accents that harmonize with the images (approximate, without external fetching). Use CSS variables.

Remember:
- Return only one \`\`\`html code block with a <style> and a single <section> root.
- Do not include <html>, <head>, or <body>. No extra commentary.`;
    return { sys, user };
}

export async function generateUI(openaiOrNull: any, model: string, prompt: string, imageUrls: string[], sequentialTools = true, provider: 'openai' | 'openrouter' = 'openrouter', openrouterKey?: string): Promise<LLMResult> {
    if (provider === 'openrouter') {
        const key = openrouterKey || process.env.OPENROUTER_API_KEY;
        if (!key) throw new Error('Missing OpenRouter API key');
        const { sys, user } = buildPrompt(prompt, imageUrls);
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                temperature: 0.3,
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: user },
                ],
            }),
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`OpenRouter error ${resp.status}: ${text}`);
        }
        const json = await resp.json() as any;
        const content = json?.choices?.[0]?.message?.content || '';
        if (!content) throw new Error('Empty response from model');
        return { rawText: content };
    }
    // OpenAI path not configured here
    throw new Error('OpenAI provider not implemented');
}
