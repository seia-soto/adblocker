import {
  CosmeticFilter,
  fullLists,
  PlaywrightBlocker,
  Request,
} from '@cliqz/adblocker-playwright';
import fetch from 'node-fetch';

import * as pw from 'playwright';

(async () => {
  const blocker = await PlaywrightBlocker.fromLists(fetch, fullLists, {
    enableCompression: true,
  });

  const browser = await pw.chromium.launch({ headless: false });
  // const browser = await pw.firefox.launch({ headless: false });
  // const browser = await pw.webkit.launch();

  const context = await browser.newContext();
  const page = await context.newPage();

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

  blocker.on('script-injected', (script, url) => {
    console.log('script', script.length, url);
  });

  blocker.on('style-injected', (style, url) => {
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

  await page.goto('https://www.mangareader.net/');
  await page.screenshot({ path: 'output.png' });
  await blocker.disableBlockingInPage(page);
  await browser.close();
})();
