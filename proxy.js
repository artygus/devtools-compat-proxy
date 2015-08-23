#!/usr/bin/env node

var util = require('util'),
    colors = require('colors'),
    mapper = require('./mapper'),
    WebSocket = require('ws');

var ws = new WebSocket('ws://localhost:9222/devtools/page/1'),
    wss,
    methodsBuf = {};

ws.on('error', function(e) {
  console.log('ws error: ' + e.code);
}); 

ws.on('open', function() {
  console.log('connected to iwdp');
  wss = new WebSocket.Server({port: 9322});

  wss.on('connection', function connection(socket) {
    socket.on('message', function(rawMsg) {
      console.log('proxyServer received:'.green + ' %s', rawMsg);

      var msg = JSON.parse(rawMsg);
      methodsBuf[msg.id] = msg.method;
      console.log('[DEBUG] '.blue + ' %s', JSON.stringify(methodsBuf));
      ws.send(rawMsg);
    });

    ws.on('message', function(rawMsg) {
      console.log('proxyClient received:'.red + ' %s', rawMsg);

      var msg = JSON.parse(rawMsg);

      if ('id' in msg) {
        console.log('[DEBUG] '.blue + ' method %s', methodsBuf[msg.id]);
        mapper.map(methodsBuf[msg.id], msg.result);
        delete methodsBuf[msg.id];
      }

      socket.send(JSON.stringify(msg));
    });
  }); 
});
