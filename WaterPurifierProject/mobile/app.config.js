const fs = require('node:fs');
const appConfig = require('./app.json').expo;

appConfig.extra = {
  ...appConfig.extra,
  eas: {
    ...appConfig.extra?.eas,
    projectId: '4d87d8fc-63a3-42e5-9c5e-5fbaa4d875cd',
  },
};

if (fs.existsSync('./google-services.json')) {
  appConfig.android.googleServicesFile = './google-services.json';
}

module.exports = appConfig;
