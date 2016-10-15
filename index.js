"use strict";

const PORT   = process.env.PORT || 5000;

const http   = require('http');
const whois  = require('node-whois');

const server = http.createServer(handleRequest);

// Request callback
function handleRequest (request, response) {
  let addr = request.connection.remoteAddress;

  whois.lookup(addr, (err, data) => {
    if (err) {
      response.statusCode = 400;
      response.end(err.message);
    } else {
      response.end(data);
    }
  });
}

// Start server
server.listen(PORT, () => {
  console.log("Server listening on port: %s", PORT);
});