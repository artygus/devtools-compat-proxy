#!/usr/bin/env node

const request = require('request'),
      Page = require('./lib/page.js');

request('http://localhost:9222/json', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var json = JSON.parse(body);

    for (var pageJson of json) {
      new Page(pageJson);
    }
  } else {
    console.log('is device connected on :9222?');
  }
})
