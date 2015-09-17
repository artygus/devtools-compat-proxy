const PageConnection = require('./page-connection');

var Page = function(json) {
  this.conn = new PageConnection(json);
  this.conn.connect();
}

Page.prototype = {
  
}

module.exports = Page;
