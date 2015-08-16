#!/usr/bin/env node

var util = require('util'),
    colors = require('colors'),
    debugProxy = require('./mapper'),
    WebSocket = require('ws');

var ws = new WebSocket('ws://localhost:9222/devtools/page/1'),
    wss;

ws.on('error', function(e) {
  console.log('ws error: ' + e.code);
}); 

ws.on('open', function() {
  console.log('connected to iwdp');
  wss = new WebSocket.Server({port: 9322});

  wss.on('connection', function connection(socket) {
    socket.on('message', function(rawMsg) {
      console.log('proxyServer received:'.green + ' %s', rawMsg);
      ws.send(rawMsg);
    });

    ws.on('message', function(rawMsg) {
      console.log('proxyClient received:'.red + ' %s', rawMsg);

      var msg = JSON.parse(rawMsg);

      debugProxy.map(msg);
      socket.send(JSON.stringify(msg));
    });
  }); 
});
