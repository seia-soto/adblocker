import type { EnvironmentalFactors, Result } from '@cliqz/adblocker-e2e';

// Utils
async function afterDomLoad(): Promise<null> {
  if (document.readyState !== 'loading') {
    return null;
  }

  return new Promise<null>((resolve) => {
    function handleReadyStateChange() {
      document.removeEventListener('readystatechange', handleReadyStateChange);
      resolve(null);
    }

    document.addEventListener('readystatechange', handleReadyStateChange);
  });
}

async function get(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
): Promise<[boolean, Response | Error]> {
  const responseOrError = await fetch(input, init).catch((error: Error) => {
    return error;
  });

  return [responseOrError instanceof Response, responseOrError];
}

function isElementVisible(element: HTMLElement) {
  if (element.offsetWidth > 0) {
    return true;
  }

  if (element.offsetHeight > 0) {
    return true;
  }

  return element.getClientRects().length > 0;
}

// Collectors
async function isNetworkFilteringAvailable(): Promise<boolean> {
  const [result] = await get('/generate_200/block');

  return !result;
}

function isCosmeticFilteringAvailable(): boolean {
  const root = document.querySelector('#cosmetic0');

  return (
    isElementVisible(root.querySelector('.allow')) &&
    !isElementVisible(root.querySelector('.block'))
  );
}

async function collectEnvironmentalFactors(): Promise<EnvironmentalFactors> {
  const factors: EnvironmentalFactors = {
    userAgent: navigator.userAgent,
    coverage: {
      networkFiltering: await isNetworkFilteringAvailable(),
      cosmeticFiltering: isCosmeticFilteringAvailable(),
    },
  };

  return factors;
}

async function e2e() {
  await afterDomLoad();

  const environment = await collectEnvironmentalFactors();
  const result: Result = {
    environment,
    capabilities: {
      network: {},
      cosmetic: {},
    },
  };

  return result;
}

async function main() {
  const result = await e2e();

  document.querySelector('#report > pre').textContent = JSON.stringify(result, null, 2);
}

void main();
