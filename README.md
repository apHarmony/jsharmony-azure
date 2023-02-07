# ===============
# jsharmony-azure
# ===============

Azure integration for jsharmony projects

## Installation

npm install jsharmony-azure --save

## Initial Configuration

Add to your config file
```
var jsHarmonyAzure = require('jsharmony-azure');

....

  jsh.AddModule(new jsHarmonyAzure());

  var configAzure = config.modules['jsHarmonyAzure'];
  if (configAzure) {
    configAzure.communication.connectionString = '.............';
    configAzure.communication.smsFrom = '+18443332222';
  }
```
