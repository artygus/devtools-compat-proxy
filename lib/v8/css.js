function Css(conn) {
  this.conn = conn;
  this.conn.on('remote::CSS.enable', this.injectStylesheets.bind(this));
  this.conn.registerMessageHandler('remote::CSS.getMatchedStylesForNode', this.getMatchedStylesForNodeHandler.bind(this));
}

Css.prototype = {
  mapSelectorList: function(selectorList) {
    var range = selectorList.range;

    for (var i = 0; i < selectorList.selectors.length; i++) {
      selectorList.selectors[i] = {
        value: selectorList.selectors[i]
      }
      if (range !== undefined)
        selectorList.selectors[i].range = range;
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
    for (var i in cssStyle.cssProperties)
      this.mapCssProperty(cssStyle.cssProperties[i]);


    if (ruleOrigin !== 'user-agent')
      cssStyle.styleSheetId = cssStyle.styleId.styleSheetId;

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

    return msg;
  },

  injectStylesheets: function() {
    this.conn.request('CSS.getAllStyleSheets', {}).then(function(msgResult) {
      for (var header of msgResult.headers) {
        this.mapStylesheetHeader(header);
        this.conn.trigger('CSS.styleSheetAdded', {header: header});
      }
    }.bind(this));
  },
}

module.exports = Css;
