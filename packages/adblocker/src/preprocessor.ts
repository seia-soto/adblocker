/*!
 * Copyright (c) 2017-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Config from './config';
import { fastStartsWith } from './utils';

export default class Preprocessor {
  public static parse(line: string, config: Partial<Config>): Preprocessor | undefined {
    if (!fastStartsWith(line, '#!if ')) {
      return;
    }

    let tokenIndexStart = line.indexOf(' ') + 1;
    // If the condition starts with '!', negate the condition at the end
    let negate = false;
    // If the condition specified by token is supported
    let supported = false;

    if (line.charCodeAt(tokenIndexStart) === 33 /* '!' */) {
      tokenIndexStart++;
      negate = true;
    }

    const token = line.slice(tokenIndexStart);

    switch (token) {
      // Extensions
      case 'ext_ghostery': {
        supported = true;

        break;
      }
      case 'ext_ublock':
      case 'ext_abp':
      case 'adguard':
      case 'adguard_app_android':
      case 'adguard_app_ios':
      case 'adguard_app_mac':
      case 'adguard_app_windows':
      case 'adguard_ext_android_cb': {
        supported = false;

        break;
      }

      // Environments & Browsers
      case 'ext_mv3': {
        supported = !!config.loadManifestV3OnlyFilters;

        break;
      }
      case 'env_edge':
      case 'env_chromium':
      case 'adguard_ext_chromium':
      case 'adguard_ext_edge':
      case 'adguard_ext_opera': {
        supported = !!config.loadChromiumOnlyFilters;

        break;
      }
      case 'env_firefox':
      case 'adguard_ext_firefox': {
        supported = !!config.loadFirefoxOnlyFilters;

        break;
      }
      case 'env_safari':
      case 'adguard_ext_safari': {
        supported = !!config.loadSafariOnlyFilters;

        break;
      }
      case 'env_mobile': {
        supported = !!config.loadMobileOnlyFilters;

        break;
      }

      // Capabilities & Misc
      case 'false': {
        supported = false;

        break;
      }
      case 'cap_html_filtering': {
        supported = !!config.enableHtmlFiltering;

        break;
      }
      case 'cap_user_stylesheet': {
        supported = !!config.loadCosmeticFilters;

        break;
      }
      default: {
        return;
      }
    }

    if (negate) {
      supported = !supported;
    }

    return new this({
      negative: !supported,
      rawLine: config.debug === true ? line : undefined,
    });
  }

  public negative: boolean | undefined;
  public readonly rawLine: string | undefined;

  constructor({
    negative = false,
    rawLine,
  }: {
    negative: boolean | undefined;
    rawLine: string | undefined;
  }) {
    this.negative = negative;
    this.rawLine = rawLine;
  }

  public update(line: string): boolean {
    if (line === '#!else') {
      this.negative = !this.negative;

      // Preprocessor block doesn't end here
      return false;
    } else if (line === '#!endif') {
      return true;
    }

    // We'll ignore this line as invalid
    return false;
  }
}
