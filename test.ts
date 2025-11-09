// This file is required by karma.conf.js and loads recursively all the .spec and framework files
// Typings for Webpack's require.context
declare const require: {
  context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

import 'zone.js/testing'; // Make sure zone.js/testing is imported for Angular testing.
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: true } // Add this for Angular 18+ for better test isolation
  }
);

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);