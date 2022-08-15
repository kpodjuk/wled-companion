var mdns = require("multicast-dns")();

module.exports = {
  init: function () {
    // MDNS handling
    mdns.on("response", function (response) {
      console.log("got a response packet:", response);
    });

    mdns.on("query", function (query) {
      console.log("got a query packet:", query);
    });
    this.sendQuery(); // send first query
  },

  sendQuery: function () {
    console.log("Trying to discover nodes...".blue);
  },
};

// questions:[{
//   name: '_http._tcp',
//   type: 'A'

// mdns.query([{ name: "_http._tcp", type: "A" }]);
