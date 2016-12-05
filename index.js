"use strict";

const PORT      = process.env.PORT || 5000;

const http      = require('http');
const NodeCache = require('node-cache');
const whois     = require('node-whois');
const requestIp = require('request-ip');

const cache     = new NodeCache({"stdTTL": 3600, "checkperiod": 0});
const server    = http.createServer(handleRequest);

// Request callback
function handleRequest (request, response) {
  let addr = requestIp.getClientIp(request);
  let data = cache.get(addr);

  if (data) {
    send(request, response, null, data);
  } else {
    whois.lookup(addr, (err, data) => {
      cache.set(addr, data);
      send(request, response, err, data);
    });
  }
}

// Send response
function send (request, response, err, data) {
  if (err) {
    response.statusCode = 400;
    response.end(err.message);
  } else {
    response.end(data);
  }
}

// Start server
server.listen(PORT, () => {
  console.log("Server listening on port: %s", PORT);

  if (process.env.NODE_ENV === 'development') {
    cache
      .on('set', (key, value) => {
        console.log('CACHE SET: %s', key);
      })
      .on('expired', (key, value) => {
        console.log('CACHE EXPIRED: %s', key);
      });
  }
});