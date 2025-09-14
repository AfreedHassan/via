"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var firecrawl_js_1 = require("@mendable/firecrawl-js");
var cheerio = require("cheerio");
var path = require("path");
var dotenv = require("dotenv");
function initFirecrawl(apiKey) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                console.log('Initializing Firecrawl...');
                return [2 /*return*/, new firecrawl_js_1.default({ apiKey: apiKey })];
            }
            catch (error) {
                console.error('Failed to initialize Firecrawl:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
var rootEnvPath = path.join(__dirname, '../../.env');
console.log('Looking for .env file at:', rootEnvPath);
var envResult = dotenv.config({ path: rootEnvPath });
if (envResult.error) {
    console.error('Error loading .env file:', envResult.error);
}
else {
    console.log('.env file loaded successfully');
}
var app = new firecrawl_js_1.default({ apiKey: process.env.FIRECRAWL_API_KEY });
// Step 1: Get shot links from Dribbble popular page
function getShotLinks() {
    return __awaiter(this, void 0, void 0, function () {
        var result, html, $, shotLinks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, app.scrape("https://dribbble.com/shots/popular", {
                        formats: ['html'],
                        waitFor: 2000
                    })];
                case 1:
                    result = _a.sent();
                    html = (result === null || result === void 0 ? void 0 : result.html) || '';
                    $ = cheerio.load(html);
                    shotLinks = [];
                    $("a.shot-thumbnail-link.dribbble-link.js-shot-link").each(function (_, el) {
                        var href = $(el).attr("href");
                        if (href && shotLinks.length < 20) {
                            // Only add domain if href doesn't already start with http
                            var fullUrl = href.startsWith('http') ? href : "https://dribbble.com".concat(href);
                            shotLinks.push(fullUrl);
                        }
                    });
                    return [2 /*return*/, shotLinks];
            }
        });
    });
}
// Step 2: For each shot, extract the image
function getShotImage(url) {
    return __awaiter(this, void 0, void 0, function () {
        var result, html, $, image;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, app.scrape(url, {
                        formats: ['html'],
                        waitFor: 2000
                    })];
                case 1:
                    result = _a.sent();
                    html = (result === null || result === void 0 ? void 0 : result.html) || '';
                    $ = cheerio.load(html);
                    image = $("img.v-img.content-block.border-radius-8").first().attr("src");
                    return [2 /*return*/, image || null];
            }
        });
    });
}
function scrapeShotWithDetails(link) {
    return __awaiter(this, void 0, void 0, function () {
        var result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, app.scrape(link, {
                            formats: ['html'],
                            actions: [
                                { type: "click", selector: "button[data-original-title='Shot details']" }, // button to click },
                                { type: 'wait', milliseconds: 3000 },
                                { type: 'scrape' }
                            ],
                        })];
                case 1:
                    result = _a.sent();
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
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.error("Scraping failed:", e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Step 3: Orchestrate
function scrape20Images() {
    return __awaiter(this, void 0, void 0, function () {
        var links, images, _i, links_1, link, img, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getShotLinks()];
                case 1:
                    links = _a.sent();
                    images = [];
                    _i = 0, links_1 = links;
                    _a.label = 2;
                case 2:
                    if (!(_i < links_1.length)) return [3 /*break*/, 6];
                    link = links_1[_i];
                    console.log("Processing link: ".concat(link));
                    return [4 /*yield*/, getShotImage(link)];
                case 3:
                    img = _a.sent();
                    return [4 /*yield*/, scrapeShotWithDetails(link)];
                case 4:
                    html = _a.sent();
                    if (img)
                        images.push(img);
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, images];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var images;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, scrape20Images()];
            case 1:
                images = _a.sent();
                console.log("Extracted images:", images);
                return [2 /*return*/];
        }
    });
}); })();
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
