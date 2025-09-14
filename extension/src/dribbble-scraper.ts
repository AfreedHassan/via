import Firecrawl from "@mendable/firecrawl-js";
import * as cheerio from "cheerio";
import * as path from 'path';
import * as dotenv from 'dotenv';

async function initFirecrawl(apiKey: string) {
    try {
        console.log('Initializing Firecrawl...');
        return new Firecrawl({ apiKey });
    } catch (error) {
        console.error('Failed to initialize Firecrawl:', error);
        throw error;
    }
}

const rootEnvPath = path.join(__dirname, '../../.env');
console.log('Looking for .env file at:', rootEnvPath);

const envResult = dotenv.config({ path: rootEnvPath });
if (envResult.error) {
    console.error('Error loading .env file:', envResult.error);
} else {
    console.log('.env file loaded successfully');
}

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Step 1: Get shot links from Dribbble popular page
async function getShotLinks() {
  const result = await app.scrape("https://dribbble.com/shots/popular", {
    formats: ['html'],
    waitFor: 2000
  }) as any;

  const html = result?.html || '';
  const $ = cheerio.load(html);

  const shotLinks: string[] = [];
  $("a.shot-thumbnail-link.dribbble-link.js-shot-link").each((_, el) => {
    const href = $(el).attr("href");
    if (href && shotLinks.length < 20) {
      // Only add domain if href doesn't already start with http
      const fullUrl = href.startsWith('http') ? href : `https://dribbble.com${href}`;
      shotLinks.push(fullUrl);
    }
  });

  return shotLinks;
}

// Step 2: For each shot, extract the image
async function getShotImage(url: string) {
  const result = await app.scrape(url, {
    formats: ['html'],
    waitFor: 2000
  }) as any;

  const html = result?.html || '';
  const $ = cheerio.load(html);

  const image = $("img.v-img.content-block.border-radius-8").first().attr("src");
  return image || null;
}

async function scrapeShotWithDetails(link: string) {
    try {
      const result = await app.scrape(link, {
            formats: ['html'],
            actions: [
              { type: "click", selector: "button[data-original-title='Shot details']" },// button to click },
              { type: 'wait', milliseconds: 3000 },
              { type: 'scrape' }
            ],
      });
  
      /*
const doc = await firecrawl.scrape('https://example.com/login', {
  formats: ['markdown'],
  actions: [
    { type: 'write', text: 'john@example.com' },
    { type: 'press', key: 'Tab' },
    { type: 'write', text: 'secret' },
    { type: 'click', selector: 'button[type="submit"]' },
    { type: 'wait', milliseconds: 1500 },
    { type: 'screenshot', fullPage: true },
  ],
      */
     console.log(result);
      //console.log("HTML after click:\n", (result as any).html);
    } catch (e) {
      console.error("Scraping failed:", e);
    }
  }

// Step 3: Orchestrate
async function scrape20Images() {

  const links = await getShotLinks();
  const images: string[] = [];

  for (const link of links) {
    console.log(`Processing link: ${link}`);
    const img = await getShotImage(link);
    const html = await scrapeShotWithDetails(link);
    if (img) images.push(img);
  }

  return images;
}


(async () => {
  const images = await scrape20Images();
  console.log("Extracted images:", images);
})();

// import Firecrawl from '@mendable/firecrawl-js';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import * as dotenv from 'dotenv';
// import * as cheerio from 'cheerio';

// interface ShotData {
//     url: string;
//     image: string;
// }



// async function getShotLinks(fc: any, limit: number = 5): Promise<string[]> {
//     console.log('Fetching popular shots...');
//     const result = await fc.crawl('https://dribbble.com/shots/popular', {
//         limit: 5,
//         waitFor: 2000,
//         render: true,
//         extract: {
//             selectors: {
//                 image: "img.v-img.content-block.border-radius-8::attr(src)"
//             }
//         }
//     }) as any;

//     const links = result?.data?.map((item: any) => {
//         const url = item.url?.startsWith('http') ? item.url : `https://dribbble.com${item.url}`;
//         return url;
//     }) || [];

//     console.log(`Found ${links.length} shot links`);
//     return links;
// }

// async function extractShotDetails(fc: any, url: string): Promise<ShotData> {
//     console.log(`Processing shot: ${url}`);
    
//     // First scrape to get main image and initial content
//     const result = await fc.crawl(url, {
//         render: true,
//         extract: {
//             selectors: {
//                 image: "img.v-img.content-block.border-radius-8::attr(src)"
//             }
//         }
//     }) as any;

//     const image = result?.data?.image || '';
//     console.log('image:', image);

//     return {
//         url,
//         image
//     };
// }

// async function main() {
//     try {
//         // Load .env from root directory
//         const rootEnvPath = path.join(__dirname, '../../.env');
//         console.log('Looking for .env file at:', rootEnvPath);
        
//         const envResult = dotenv.config({ path: rootEnvPath });
//         if (envResult.error) {
//             console.error('Error loading .env file:', envResult.error);
//         } else {
//             console.log('.env file loaded successfully');
//         }

//         const apiKey = process.env.FIRECRAWL_API_KEY;
//         if (!apiKey) {
//             throw new Error('FIRECRAWL_API_KEY not found in .env file');
//         }
//         console.log('Starting scraper...');
//         console.log('Using API key:', apiKey.substring(0, 3) + '...');

//         const fc = await initFirecrawl(apiKey);
//         const shotLinks = await getShotLinks(fc, 5);
        
//         const results: ShotData[] = [];
//         for (const url of shotLinks) {
//             try {
//                 const shotData = await extractShotDetails(fc, url);
//                 results.push(shotData);
//                 console.log(`Successfully processed: ${url}`);
//                 // Add a delay between shots to be nice to Dribbble
//                 await new Promise(r => setTimeout(r, 2000));
//             } catch (error) {
//                 console.error(`Failed to process ${url}:`, error);
//             }
//         }

//         // Save results
//         const outputPath = path.join(__dirname, 'results.json');
//         await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
//         console.log(`Saved ${results.length} results to ${outputPath}`);

//     } catch (error) {
//         console.error('Script failed:', error);
//         process.exit(1);
//     }
// }

// // Run the script
// main();

