function Css(conn) {
  this.conn = conn;
  this.conn.on('remote::CSS.enable', this.injectStylesheets.bind(this));
  this.conn.registerMessageHandler('remote::CSS.getMatchedStylesForNode', this.getMatchedStylesForNodeHandler.bind(this));
  this.conn.registerMessageHandler('proxy::CSS.setStyleText', this.setStyleText.bind(this));

  this.styleIdBuffer = new Map();
}

Css.prototype = {
  // helpers
  makeStyleKey: function(styleSheetId, range) {
    return [styleSheetId, JSON.stringify(range)].join('_');
  },

  // mappings
  mapSelectorList: function(selectorList) {
    var range = selectorList.range;

    for (var selector of selectorList.selectors) {
      selector.value = selector.text;
      delete selector.text;

      if (range !== undefined)
        selector.range = range;
    }

    delete selectorList.range;
  },

  mapCssProperty: function(cssProperty) {
    if (cssProperty.status == 'disabled') {
      cssProperty.disabled = true;
    } else if (cssProperty.status == 'active') {
      cssProperty.disabled = false;
    }

    delete  cssProperty.status;
  },

  mapStyle: function(cssStyle, ruleOrigin) {
    for (var cssProperty of cssStyle.cssProperties)
      this.mapCssProperty(cssProperty);


    if (ruleOrigin !== 'user-agent') {
      cssStyle.styleSheetId = cssStyle.styleId.styleSheetId;
      var styleKey = this.makeStyleKey(cssStyle.styleSheetId, cssStyle.range);
      this.styleIdBuffer.set(styleKey, cssStyle.styleId);
    }

    delete cssStyle.styleId;
    delete cssStyle.sourceLine;
    delete cssStyle.sourceURL;
    delete cssStyle.width;
    delete cssStyle.height;
  },

  mapRule: function(cssRule) {
    if ('ruleId' in cssRule) {
      cssRule.styleSheetId = cssRule.ruleId.styleSheetId;
      delete cssRule.ruleId;
    }

    this.mapSelectorList(cssRule.selectorList);
    this.mapStyle(cssRule.style, cssRule.origin);

    delete cssRule.sourceLine;
  },

  mapStylesheetHeader: function(stylesheetHeader) {
    stylesheetHeader.isInline = false;
    stylesheetHeader.startLine = 0;
    stylesheetHeader.startColumn = 0;
  },

  // event handlers
  injectStylesheets: function() {
    this.conn.request('CSS.getAllStyleSheets', {}).then(function(msgResult) {
      for (var header of msgResult.headers) {
        this.mapStylesheetHeader(header);
        this.conn.trigger('CSS.styleSheetAdded', {header: header});
      }
    }.bind(this));
  },

  // message handlers
  getMatchedStylesForNodeHandler: function(msg) {
    var result = msg.result;

    for (var i in result.matchedCSSRules) {
      this.mapRule(result.matchedCSSRules[i].rule);
    }

    for (var i in result.inherited) {
      for (var j in result.inherited[i].matchedCSSRules) {
        this.mapRule(result.inherited[i].matchedCSSRules[j].rule);
      }
    }
  },

  setStyleText: function(msg) {
    var styleKey = this.makeStyleKey(msg.params.styleSheetId, msg.params.range);
    msg.params.styleId = this.styleIdBuffer.get(styleKey);
    delete msg.params.styleSheetId;
    delete msg.params.range;
  }
}

module.exports = Css;
