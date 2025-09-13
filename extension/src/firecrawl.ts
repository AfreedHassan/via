import Firecrawl from '@mendable/firecrawl-js';

export function getFirecrawl(apiKey: string) {
    const anyCtor: any = Firecrawl as any;
    return new anyCtor({ apiKey });
}

export type Shot = { id: string; title: string; thumbUrl: string; fullUrl: string; sourceUrl: string; author?: string };

const memoryCache: Map<string, { at: number; shots: Shot[] }> = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getShots(apiKey: string, userQuery: string): Promise<Shot[]> {
    const now = Date.now();
    const cached = memoryCache.get(userQuery);
    if (cached && now - cached.at < CACHE_TTL_MS) {
        return cached.shots;
    }

    const fc = getFirecrawl(apiKey);
    const q = `site:dribbble.com ${userQuery}`;
    const res = await searchWithRetry(fc, {
        query: q,
        limit: 16,
        sources: ['web', 'images'],
        scrapeOptions: { formats: ['html'], waitFor: 1200 }
    });

    const fromImages = (res?.data?.images || [])
        .filter((i: any) => i.url?.includes('dribbble.com'))
        .map((i: any) => ({ id: i.url, title: i.title || 'Dribbble', thumbUrl: i.imageUrl, fullUrl: i.imageUrl, sourceUrl: i.url }));

    const shotPages = (res?.data?.web || [])
        .map((w: any) => w.url)
        .filter((u: string) => /dribbble\.com\/shots\//.test(u))
        .slice(0, 16);

    const fromPages: Shot[] = [];
    for (const url of shotPages) {
        try {
            const r = await fc.scrape(url, { formats: ['html'], waitFor: 1500 });
            const html: string = r?.data?.html || '';
            const m = [...html.matchAll(/<img[^>]+src="([^"]+cdn\.dribbble\.com[^"]+)"[^>]*alt="([^"]*)"/gi)];
            if (m[0]) {
                const src = m[0][1];
                const alt = m[0][2];
                fromPages.push({ id: url, title: alt || 'Dribbble shot', thumbUrl: src, fullUrl: src, sourceUrl: url });
            }
        } catch {
            // ignore individual scrape failures
        }
        await delay(350);
    }

    const map = new Map<string, Shot>();
    [...fromImages, ...fromPages].forEach(s => map.set(s.sourceUrl, s));
    const shots = [...map.values()].slice(0, 20);
    memoryCache.set(userQuery, { at: now, shots });
    return shots;
}

async function searchWithRetry(fc: any, args: any, attempts = 3): Promise<any> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fc.search(args);
        } catch (e: any) {
            lastErr = e;
            const backoff = Math.min(1000 * Math.pow(2, i), 4000);
            await delay(backoff);
        }
    }
    throw lastErr;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }


