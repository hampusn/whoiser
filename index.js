"use strict";

const PORT      = process.env.PORT || 5000;

const http      = require('http');
const NodeCache = require('node-cache');
const whoiser   = require('whoiser');
const requestIp = require('request-ip');

const cacheTtl  = process.env.CACHE_TTL || 86400;
const cache     = new NodeCache({"stdTTL": cacheTtl, "checkperiod": 0});
const server    = http.createServer(handleRequest);

// Request callback
function handleRequest (request, response) {
  let addr = requestIp.getClientIp(request);
  let data = cache.get(addr);

  if (data) {
    send(request, response, null, data, addr);
  } else {
    whoiser(addr, { raw: true })
      .then(({ __raw: raw = '' }) => {
        cache.set(addr, raw);
        send(request, response, null, raw, addr);
      })
      .catch((err) => {
        cache.set(addr, err + '');
        send(request, response, err, err + '', addr);
      });
  }
}

// Send response
function send (request, response, err, data, addr) {
  if (err) {
    response.statusCode = 400;
    response.end(err.message);
  } else {
    let millisLeft = cache.getTtl(addr);
    if (parseInt(millisLeft) > 0) {
      response.setHeader('Cache-Control', 'public, max-age=' + cacheTtl);
      response.setHeader('Expires', new Date(millisLeft).toUTCString());
    }
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