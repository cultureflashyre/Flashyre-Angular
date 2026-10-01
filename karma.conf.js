// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

if (!process.env.CHROME_BIN) {
  process.env.CHROME_BIN = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // Suppress all messages (e.g., ones about test success)
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/flashyre'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-translate',
          '--disable-extensions',
          '--remote-debugging-port=9222'
        ]
      }
    },
    singleRun: true,
    restartOnFileChange: false
  });
};
