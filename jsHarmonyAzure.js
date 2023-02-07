/*
Copyright 2022 apHarmony

This file is part of jsHarmony.

jsHarmony is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsHarmony is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this package.  If not, see <http://www.gnu.org/licenses/>.
*/

var _ = require('lodash');
var jsHarmonyModule = require('jsharmony/jsHarmonyModule');
var jsHarmonyAzureConfig = require('./jsHarmonyAzureConfig.js');
var SmsClient = require('@azure/communication-sms').SmsClient;
var ejs = require('jsharmony/lib/ejs');

function jsHarmonyAzure(name, options){
  options = _.extend({
    schema: 'jsharmony'
  }, options);

  var _this = this;
  jsHarmonyModule.call(this, name);
  _this.Config = new jsHarmonyAzureConfig();

  if(name) _this.name = name;
  _this.typename = 'jsHarmonyAzure';

  _this.schema = options.schema;
}

jsHarmonyAzure.prototype = new jsHarmonyModule();

jsHarmonyAzure.prototype.sendTXTSMS = function(dbcontext, txt_attrib, sms_to, params, sms_options, callback){
  var _this = this;
  var jsh = this.jsh;
  //Load TXT data from database
  var dbtypes = jsh.AppSrv.DB.types;
  jsh.AppSrv.ExecRecordset(dbcontext, 'sms_send_txt', [dbtypes.VarChar(32)], { 'txt_attrib': txt_attrib }, function (err, rslt) {
    if ((rslt != null) && (rslt.length == 1) && (rslt[0].length == 1)) {
      var TXT = rslt[0][0];
      _this.sendBaseSMS(TXT[jsh.map.txt_body], sms_to, params, sms_options, callback);
    }
    else return callback(new Error('SMS ' + txt_attrib + ' not found.'));
  });
};

jsHarmonyAzure.prototype.sendBaseSMS = function(sms_body, sms_to, params, sms_options, callback){
  var _this = this;
  sms_to = sms_to || null;
  
  var mparams = {};
  if (sms_to) mparams.to = sms_to;
  mparams.text = sms_body;
  //Replace Params
  try {
    mparams.text = ejs.render(mparams.text, { data: params, _: _ });
  }
  catch (e) {
    return callback(e);
  }
  _this.sendSMS(mparams, sms_options, callback);
};

jsHarmonyAzure.prototype.sendSMS = function(mparams, sms_options, callback){
  var _this = this;
  if(!_this.Config || !_this.Config.communication || !_this.Config.communication.connectionString) return callback(new Error('Azure communication.connectionString not defined in config'));
  if(!_this.Config || !_this.Config.communication || !_this.Config.communication.smsFrom) return callback(new Error('Azure communication.smsFrom not defined in config'));

  if (!('from' in mparams)) mparams.from = _this.Config.communication.smsFrom;
  if(!mparams.to) return callback(new Error('SMS missing destination'));
  if(!_.isArray(mparams.to)) mparams.to = [mparams.to];
  var msg = (mparams.text||'').toString();

  (async function(){
    try{
      var smsClient = new SmsClient(_this.Config.communication.connectionString);
      var sendResults = await smsClient.send({
        from: mparams.from,
        to: mparams.to,
        message: msg
      }, sms_options);
    
      for (var sendResult of sendResults) {
        if (!sendResult.successful) {
          var errmsg = sendResult.errorMessage||'Unexpected failure';
          return callback(new Error('Error sending SMS: '+errmsg));
        }
      }
      return callback();
    }
    catch(ex){
      return callback(new Error('Error sending SMS: '+ex.toString()));
    }
  })();
};

module.exports = exports = jsHarmonyAzure;