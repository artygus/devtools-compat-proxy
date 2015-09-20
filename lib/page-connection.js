const WebSocket = require('ws'),
      colors = require('colors'),
      events = require('events'),
      util = require('util');

var PageConnection = function(pageJson) {
  this.pageJson = pageJson;
  this.serviceRequestID = 0;

  this.messageBuffer = new Map();
  this.requestBuffer = new Map();

  this.messageHandlers = new Map();

  events.EventEmitter.call(this);
}

util.inherits(PageConnection, events.EventEmitter);

util._extend(PageConnection.prototype, {
  connect: function() {
    // device socket
    this.remoteSocket = new WebSocket(this.pageJson.webSocketDebuggerUrl);

    this.remoteSocket.on('error', function(e) {
      console.error('page socket error: %s', e.code);
    });

    this.remoteSocket.on('message', this.onRemoteMessage.bind(this));

    // server socket
    this.server = new WebSocket.Server({port: 9322});

    this.server.on('error', function(e) {
      console.error('proxy socket error: %s', e.code);
    });

    this.server.on('connection', function(clientSocket) {
      this.proxySocket && this.proxySocket.close();

      clientSocket.on('message', this.onProxyMessage.bind(this));

      // devtools socket
      this.proxySocket = clientSocket;
    }.bind(this));
  },

  close: function() {
    this.remoteSocket.close();
    this.server.close();
  },

  request: function(method, params) {
    return new Promise(function(resolve, reject) {
      var request = {
        id: --this.serviceRequestID,
        method: method,
        params: params
      };

      this.requestBuffer.set(request.id, { resolve: resolve, reject: reject });
      this.remoteSocket.send(JSON.stringify(request));
    }.bind(this));
  },

  trigger: function(method, params) {
    var request = {
      method: method,
      params: params
    };

    this.proxySocket.send(JSON.stringify(request));
  },

  onRemoteMessage: function(rawMsg) {
    var msg = JSON.parse(rawMsg);

    if ('id' in msg) {
      if (this.messageBuffer.has(msg.id)) {
        if ('result' in msg) {
          var eventName = ['remote', this.messageBuffer.get(msg.id)].join('::');

          this.emit(eventName, msg.result);

          if (this.messageHandlers.has(eventName)) {
            this.messageHandlers.get(eventName)(msg);
            rawMsg = JSON.stringify(msg);
          }
        } else if ('error' in msg) {
          console.log('error in remote message', rawMsg);
        } else {
          console.log('unhandled type of remote message', rawMsg);
        }

        this.messageBuffer.delete(msg.id);
        this.proxySocket.send(rawMsg);
      } else if (this.requestBuffer.has(msg.id)) {
        if ('result' in msg) {
          this.requestBuffer.get(msg.id).resolve(msg.result);
        } else if ('error' in msg) {
          this.requestBuffer.get(msg.id).reject(msg.error);
        } else {
          console.log('unhandled type of request message', rawMsg);
        }

        this.requestBuffer.delete(msg.id);
      } else {
        console.log('unhandled remote message', rawMsg);
      }
    } else {
      // event?
      this.proxySocket.send(rawMsg);
    }
  },

  onProxyMessage: function(rawMsg) {
    var msg = JSON.parse(rawMsg),
        eventName = ['proxy', msg.method].join('::');

    this.messageBuffer.set(msg.id, msg.method);
    this.emit(eventName, msg.params);

    if (this.messageHandlers.has(eventName)) {
      this.messageHandlers.get(eventName)(msg);
      rawMsg = JSON.stringify(msg);
    }

    this.remoteSocket.send(rawMsg);
  },

  registerMessageHandler: function(method, callback) {
    this.messageHandlers.set(method, callback);
  }

});


module.exports = PageConnection;
