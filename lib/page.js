const PageConnection = require('./page-connection'),
      Css = require('./v9/css');

var Page = function(json) {
  this.conn = new PageConnection(json);
  this.conn.connect();

  new Css(this.conn);
}

Page.prototype = {

}

module.exports = Page;
