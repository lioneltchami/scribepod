#!/usr/bin/env zx
import fs from 'fs';
import 'zx/globals';
import { JSDOM } from 'jsdom';
import { extractFacts, generateDialogueFromFacts } from '../../services/openai';

export interface WebsiteData {
  [webpage: string]: string[];
}

export interface WebsiteSummary {
  [webpage: string]: string[];
}

export interface Discussion {
  [webpage: string]: string[];
}

const FOLDER_PATH = './websites';

export const getWebsiteData = async (folderPath: string): Promise<WebsiteData> => {
  const websiteData: WebsiteData = {};
  const folderPathLsResult = await $`ls ${folderPath}`;
  const files = folderPathLsResult.stdout.split('\n').filter((file) => file !== '');

  for (const file of files) {
    // check if file exists
    const html = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
    const dom = new JSDOM(html);
    // remove the script tags
    const scripts = dom.window.document.querySelectorAll('script');
    scripts.forEach((script) => script.remove());
    // save the text content
    const textContent: string = dom.window.document.body.textContent;
    const contentCleaned: string[] = textContent.split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
    websiteData[file] = contentCleaned;
  }
  return websiteData;
}

export const splitPageIntoSections = (lines: string[], wordCountGoal: number): string[] => {
  // split the page into equal sections, as close as to the word count goal as possible
  const totalWords = lines.join(' ').split(' ').length;
  const sectionCount = Math.ceil(totalWords / wordCountGoal);
  const realWordCountGoal = Math.ceil(totalWords / sectionCount);

  const mergedLines: string[] = [];
  let mergedLine = '';
  for (const line of lines) {
    const currentLineWordCount = line.split(' ').length;
    const mergedLineWordCount = mergedLine.split(' ').length;
    if (currentLineWordCount + mergedLineWordCount <= realWordCountGoal) {
      mergedLine += ` ${line}`;
    } else {
      mergedLines.push(mergedLine);
      mergedLine = line;
    }
  }

  // add the last line to the last merged line, whatever
  mergedLines[mergedLines.length - 1] += ` ${mergedLine}`;
  return mergedLines;
}

export const generateSummary = async (websiteData: WebsiteData, writeToDisk: boolean = true): Promise<WebsiteSummary> => {
  const summarizedSites: WebsiteSummary = JSON.parse(fs.readFileSync(`./output/summaries.json`, 'utf8'));

  // Read summaries json, avoid reprocessing the same sites
  for (const [webpage, lines] of Object.entries(websiteData)) {
    if (summarizedSites.hasOwnProperty(webpage)) {
      console.log(`[ProcessWebpage] Skipping ${webpage} - already processed`);
      continue;
    }

    console.log(`[ProcessWebpage] Processing ${webpage}...`);

    // Combine all lines into one text block
    const fullText = lines.join('\n');

    try {
      // Use new OpenAI service to extract facts
      const facts = await extractFacts(fullText, webpage);

      console.log(`[ProcessWebpage] Extracted ${facts.length} facts from ${webpage}`);

      summarizedSites[webpage] = facts;

      if (writeToDisk) {
        fs.writeFileSync(`./output/summaries.json`, JSON.stringify(summarizedSites, null, 2));
        console.log(`[ProcessWebpage] Saved summaries to disk`);
      }

      // Small delay to avoid rate limiting
      await sleep(1000);

    } catch (e) {
      console.error(`[ProcessWebpage] Error processing ${webpage}:`, e);
      // Continue with next webpage
    }
  }

  return summarizedSites;
}

function splitArray(array, n) {
  const result: any[] = [];
  const chunkSize = Math.ceil(array.length / n);
  for (let i = 0; i < n; i++) {
    const startIndex = i * chunkSize;
    const chunk = array.slice(startIndex, startIndex + chunkSize);
    result.push(chunk);
  }
  return result;
}


export const generateDiscussion = async (
  summaries: WebsiteSummary,
  writeToDisk: boolean = true,
  splitsOnFacts: number = 7
): Promise<Discussion> => {
  const discussions: Discussion = JSON.parse(fs.readFileSync(`./output/discussions.json`, 'utf8'));

  for (const [title, summary] of Object.entries(summaries)) {
    if (discussions.hasOwnProperty(title)) {
      console.log(`[ProcessWebpage] Skipping ${title} - dialogue already generated`);
      continue;
    }

    console.log(`[ProcessWebpage] Generating dialogue for ${title}... number of facts: ${summary.length}`);

    // Split facts into chunks for better context management
    const summaryPoints = [...summary];
    const summaryPointsSplit = splitArray(summaryPoints, splitsOnFacts);
    console.log(`[ProcessWebpage] Split into ${summaryPointsSplit.length} chunks`);

    for (let i = 0; i < summaryPointsSplit.length; i++) {
      const factChunk = summaryPointsSplit[i];
      const isFirst = i === 0;
      const isLast = i === summaryPointsSplit.length - 1;

      console.log(`[ProcessWebpage] Processing chunk ${i + 1}/${summaryPointsSplit.length} (${factChunk.length} facts)...`);

      try {
        // Use new OpenAI service to generate dialogue
        const dialogue = await generateDialogueFromFacts(factChunk, {
          title,
          speakerA: 'Alice',
          speakerB: 'Bob',
          style: 'conversational',
          isFirst,
          isLast,
        });

        // Parse dialogue into lines
        const dialogueLines = dialogue
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== '');

        // Append to discussions
        discussions[title] = [...(discussions[title] || []), ...dialogueLines];

        console.log(`[ProcessWebpage] Generated ${dialogueLines.length} dialogue lines for chunk ${i + 1}`);

        if (writeToDisk) {
          fs.writeFileSync(`./output/discussions.json`, JSON.stringify(discussions, null, 2));
          console.log(`[ProcessWebpage] Saved discussions to disk`);
        }

        // Small delay to avoid rate limiting
        await sleep(1000);

      } catch (e) {
        console.error(`[ProcessWebpage] Error generating dialogue for ${title} chunk ${i + 1}:`, e);
        // Wait longer on error to avoid rate limiting
        await sleep(10000);
      }
    }

    break; // Process one summary at a time
  }

  return discussions;
}
