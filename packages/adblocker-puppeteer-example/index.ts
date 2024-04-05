import { fullLists, PuppeteerBlocker } from '@cliqz/adblocker-puppeteer';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import * as puppeteer from 'puppeteer';

function getUrlToLoad(): string {
  let url = 'https://www.mangareader.net/';
  if (process.argv[process.argv.length - 1].endsWith('.ts') === false) {
    url = process.argv[process.argv.length - 1];
  }

  return url;
}

(async () => {
  const blocker = await PuppeteerBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: fs.readFile,
      write: fs.writeFile,
    },
  );

  const browser = await puppeteer.launch({
    // @ts-ignore
    defaultViewport: null,
    headless: false,
  });

  const page = await browser.newPage();
  await blocker.enableBlockingInPage(page);

  blocker.on('request-blocked', (request) => {
    console.log('blocked', request.url);
  });

  blocker.on('request-redirected', (request) => {
    console.log('redirected', request.url);
  });

  blocker.on('request-whitelisted', (request) => {
    console.log('whitelisted', request.url);
  });

  blocker.on('csp-injected', (request) => {
    console.log('csp', request.url);
  });

  blocker.on('script-injected', (script: string, url: string) => {
    console.log('script', script.length, url);
  });

  blocker.on('style-injected', (style: string, url: string) => {
    console.log('style', style.length, url);
  });

  blocker.on('script-rule-matched', (rule, context) => {
    console.log('script-matched', rule, context);
  });

  blocker.on('extended-rule-matched', (rule, context) => {
    console.log('extended-rule-matched', rule, context);
  });

  blocker.on('style-rule-matched', (rule, context) => {
    console.log('style-matched', rule, context);
  });

  await page.goto(getUrlToLoad());
})();
