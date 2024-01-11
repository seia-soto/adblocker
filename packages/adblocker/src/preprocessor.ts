/*!
 * Copyright (c) 2017-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { clearBit, fastStartsWith, getBit, setBit } from './utils';

export const enum PREPROCESSOR_MASK {
  isUnsupportedPlatform = 1 << 0,
  isManifestV3 = 1 << 1,
  isMobile = 1 << 2,
  // RESERVE = 1 << 3,

  // Browser specs
  isBrowserChromium = 1 << 4,
  isBrowserFirefox = 1 << 5,
  isBrowserSafari = 1 << 6,
  isBrowserOpera = 1 << 7,

  // Capabilities
  hasHtmlFilteringCapability = 1 << 8,
  hasUserStylesheetCapability = 1 << 9,
  // RESERVE = 1 << {10...12}

  // Misc
  false = 1 << 13,
  invalid = 1 << 14,

  // Operators
  negate = 1 << 15,
  and = 1 << 16,
  or = 1 << 17,
}

function getTokenMask(token: string): number {
  let mask = 0;

  if (token.charCodeAt(0) === 33 /* '!' */) {
    token = token.slice(1);

    mask = setBit(mask, PREPROCESSOR_MASK.negate);
  }

  switch (token) {
    // Extensions
    case 'ext_ghostery': {
      return mask;
    }
    case 'ext_ublock':
    case 'ext_abp':
    case 'adguard':
    case 'adguard_app_android':
    case 'adguard_app_ios':
    case 'adguard_app_mac':
    case 'adguard_app_windows':
    case 'adguard_ext_android_cb': {
      return setBit(mask, PREPROCESSOR_MASK.isUnsupportedPlatform);
    }

    // Environments & Browsers
    case 'ext_mv3': {
      return setBit(mask, PREPROCESSOR_MASK.isManifestV3);
    }
    case 'env_edge':
    case 'env_chromium':
    case 'adguard_ext_chromium':
    case 'adguard_ext_edge':
    case 'adguard_ext_opera': {
      return setBit(mask, PREPROCESSOR_MASK.isBrowserChromium);
    }
    case 'env_firefox':
    case 'adguard_ext_firefox': {
      return setBit(mask, PREPROCESSOR_MASK.isBrowserFirefox);
    }
    case 'env_safari':
    case 'adguard_ext_safari': {
      return setBit(mask, PREPROCESSOR_MASK.isBrowserSafari);
    }
    case 'env_mobile': {
      return setBit(mask, PREPROCESSOR_MASK.isMobile);
    }

    // Capabilities & Misc
    case 'false': {
      return setBit(mask, PREPROCESSOR_MASK.false);
    }
    case 'cap_html_filtering': {
      return setBit(mask, PREPROCESSOR_MASK.hasHtmlFilteringCapability);
    }
    case 'cap_user_stylesheet': {
      return setBit(mask, PREPROCESSOR_MASK.hasUserStylesheetCapability);
    }
    default: {
      return setBit(mask, PREPROCESSOR_MASK.invalid);
    }
  }
}

export default class Preprocessor {
  public static parse(line: string, debug = false): Preprocessor | null {
    if (!fastStartsWith(line, '#!if ')) {
      return null;
    }

    const tokens: number[] = [];

    let buffer = '';
    let lastOp: PREPROCESSOR_MASK | undefined;

    // #!if $token [$op $token [$op $token [...]]]
    //      ^
    //      |
    //      i = 5
    for (let i = 5 /* '#!if '.length */; i < line.length; i++) {
      if (line.charCodeAt(i) === 38 /* & */ && line.charCodeAt(i + 1) === 38) {
        let token = getTokenMask(buffer.trim());

        if (lastOp) {
          token = setBit(token, lastOp);
        }

        tokens.push(token);

        lastOp = PREPROCESSOR_MASK.and;

        buffer = '';
        i++;
      } else if (line.charCodeAt(i) === 124 /* | */ && line.charCodeAt(i + 1) === 124) {
        let token = getTokenMask(buffer.trim());

        if (lastOp) {
          token = setBit(token, lastOp);
        }

        tokens.push(token);

        lastOp = PREPROCESSOR_MASK.or;

        buffer = '';
        i++;
      } else {
        buffer += line[i];
      }
    }

    // Clean up the remaining buffer
    // We assume the right side of string is already trimmed
    tokens.push(getTokenMask(buffer.trimStart()));

    return new this({
      tokens,
      rawLine: debug === true ? line : undefined,
    });
  }

  public readonly tokens: number[];
  public readonly rawLine: string | undefined;

  constructor({ tokens, rawLine }: { tokens: number[]; rawLine: string | undefined }) {
    this.tokens = tokens;
    this.rawLine = rawLine;
  }

  public create(line: string, debug = false) {
    if (line === '#!else') {
      const tokens: number[] = [];

      for (const token of this.tokens) {
        if (getBit(token, PREPROCESSOR_MASK.negate)) {
          tokens.push(clearBit(token, PREPROCESSOR_MASK.negate));
        } else {
          tokens.push(setBit(token, PREPROCESSOR_MASK.negate));
        }
      }

      return new Preprocessor({
        tokens,
        rawLine: debug === true ? line : undefined,
      });
    } else if (line === '#!endif') {
      return false;
    }

    return;
  }
}
