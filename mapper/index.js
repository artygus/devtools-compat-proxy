var handlers = {};

['./css'].forEach(function(path) {
  var handler = require(path);
  handlers[handler.domain] = handler;
});

module.exports = {
  identify: function(method) {
    var parts = method.split('.'),
        domain = parts.shift(),
        command = parts.shift();

    if (domain in handlers) {
      return {map: handlers[domain].map, cmd: command};
    }
  },

  map: function(method, result) {
    var handler = this.identify(method);

    if (handler) {
      handler.map(handler.cmd, result);
    }
  }
}
