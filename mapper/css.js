var mapSelectorList = function(selectorList) {
  var range = selectorList.range;

  for (var i = 0; i < selectorList.selectors.length; i++) {
    selectorList.selectors[i] = {
      value: selectorList.selectors[i]
    }
    if (range !== undefined)
      selectorList.selectors[i].range = range;
  }

  delete selectorList.range;  
};

var mapStyle = function(cssStyle) {
  cssStyle.styleSheetId = cssStyle.styleId.styleSheetId;
  delete cssStyle.styleId;
  delete cssStyle.sourceLine;
  delete cssStyle.sourceURL;
};

var mapRule = function(cssRule) {
  if ('ruleId' in cssRule) {
    // obj.styleSheetId = obj.ruleId.styleSheetId;
    delete cssRule.ruleId;
  }

  mapSelectorList(cssRule.selectorList);
  mapStyle(cssRule.style);

  delete cssRule.sourceLine;
};

var handler = function(command, result) {
  if (command === "getMatchedStylesForNode") {
    for (var i in result.matchedCSSRules) {
      mapRule(result.matchedCSSRules[i].rule);
    }

    for (var i in result.inherited) {
      for (var j in result.inherited[i].matchedCSSRules) {
        mapRule(result.inherited[i].matchedCSSRules[j].rule);
      }
    }
  }
};

module.exports = {
  map: handler,
  domain: "CSS"
}
