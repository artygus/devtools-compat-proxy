function traverse(obj, func) {
  for (var k in obj) {
    if (func(k, obj[k]) === false)
      continue;
    if (typeof obj[k] === 'object')
      traverse(obj[k], func);
  }
}

protocolMapper = {
  map: function(obj) {
    traverse(obj, function(key, obj) {
      if (key in this.handlers)
        return this.handlers[key](obj);
    }.bind(this));
  },

  handlers: {
    // CSS
    rule: function(obj) {
      if ('ruleId' in obj) {
        // obj.styleSheetId = obj.ruleId.styleSheetId;
        delete obj.ruleId;
      }
      delete obj.sourceLine;
    },

    selectorList: function(obj) {
      var range = obj.range;
      for (var i = 0; i < obj.selectors.length; i++) {
        obj.selectors[i] = {
          value: obj.selectors[i]
        }
        if (range !== undefined)
          obj.selectors[i].range = range;
      }
      delete obj.range;
      return false;
    },

    style: function(obj) {
      obj.styleSheetId = obj.styleId.styleSheetId;
      delete obj.styleId;
      delete obj.sourceLine;
      delete obj.sourceURL;
      return false;
    }
  }
}


module.exports = protocolMapper;
