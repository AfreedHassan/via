import Firecrawl from '@mendable/firecrawl-js';
import * as vscode from 'vscode';

export function getFirecrawl(apiKey: string) {
    try {
        console.log('Creating Firecrawl instance...');
        const instance = new Firecrawl({ apiKey });
        console.log('Firecrawl instance created successfully');
        return instance;
    } catch (error: any) {
        console.error('Error creating Firecrawl instance:', error);
        throw error;
    }
}

export type Shot = { id: string; title: string; thumbUrl: string; fullUrl: string; sourceUrl: string; author?: string };

const memoryCache: Map<string, { at: number; shots: Shot[] }> = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getShots(apiKey: string, userQuery: string): Promise<Shot[]> {
    console.log(`Getting shots for query: ${userQuery}`);
    const now = Date.now();
    const cached = memoryCache.get(userQuery);
    if (cached && now - cached.at < CACHE_TTL_MS) {
        console.log('Returning cached results');
        return cached.shots;
    }

    try {
        console.log('Initializing Firecrawl...');
        const fc = getFirecrawl(apiKey);
        const searchUrl = `https://dribbble.com/search/${encodeURIComponent(userQuery)}?type=shots`;
        console.log('Scraping Dribbble search page...', searchUrl);
        const data = await fc.scrape(searchUrl, {
            formats: ['html'],
            waitFor: 2500
        });
        console.log('Search completed. Processing results...');

        const html: string = (data as any)?.html || '';
        console.log('Parsing HTML for shots...');
        
        // Find all shot entries
        const shots: Shot[] = [];
        // Match anchors to /shots/... and pick the first plausible image source inside
        const matches = [...html.matchAll(/<a[^>]+href=\"(\/shots\/[^"]+)\"[\s\S]*?<img[\s\S]*?>[\s\S]*?<\/a>/gsi)];
        
        for (const match of matches) {
            const shotPath = match[1];
            const anchorBlock = match[0];
            // Try to extract a usable image URL
            const srcMatch = anchorBlock.match(/\s(?:src|data-src)=\"([^\"]+)\"/i);
            let imageUrl = srcMatch?.[1] || '';
            if (!imageUrl) {
                // Fallback to srcset: take the first URL
                const srcset = anchorBlock.match(/\ssrcset=\"([^\"]+)\"/i)?.[1] || '';
                if (srcset) {
                    imageUrl = (srcset.split(',')[0] || '').trim().split(' ')[0] || '';
                }
            }
            const title = anchorBlock.match(/\salt=\"([^\"]*)\"/i)?.[1] || '';
            const shotUrl = `https://dribbble.com${shotPath}`;
            
            // Only add if it's a CDN image
            if (imageUrl && /(?:cdn\.dribbble\.com|images\.dribbble\.com|dribbble\.s3)/i.test(imageUrl)) {
                shots.push({
                    id: shotUrl,
                    title: title || 'Dribbble shot',
                    thumbUrl: imageUrl,
                    fullUrl: imageUrl,
                    sourceUrl: shotUrl
                });
            }
        }
        
        console.log(`Found ${shots.length} shots from search page`);

        // Take the first 20 shots
        shots.splice(20);
        console.log(`Final result: ${shots.length} unique shots`);
        
        memoryCache.set(userQuery, { at: now, shots });
        return shots;
    } catch (error) {
        console.error('Error in getShots:', error);
        throw error;
    }
}

async function searchWithRetry(fc: any, args: any, attempts = 3): Promise<any> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
        try {
            console.log(`Search attempt ${i + 1}/${attempts}`);
            const result = await fc.search(args);
            console.log('Search successful');
            return result;
        } catch (e: any) {
            console.error(`Search attempt ${i + 1} failed:`, e);
            lastErr = e;
            const backoff = Math.min(1000 * Math.pow(2, i), 4000);
            console.log(`Waiting ${backoff}ms before retry...`);
            await delay(backoff);
        }
    }
    console.error('All search attempts failed');
    throw lastErr;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

