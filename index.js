'use strict';

const got = require('got');
const _ = require('lodash');
const co = require('co');
const fs = require('fs');
const path = require('path');
const ncp = require("copy-paste");

const DESC = 'Search a Gif';

const query_url = 'http://api.giphy.com/v1/gifs/search?q=';
const api_key = '&api_key=dc6zaTOxFJmzC';

function* queryGiphy(query, limit) {
  const query_enc = encodeURIComponent(query);
  const url = query_url + query_enc + api_key + `&limit=${limit}`;
  let result = (yield got(url)).body;

  result = JSON.parse(result);
  if (result['data']) {
    return result['data'].map(x => x);
  }
  return null;
}

module.exports = (context) => {
  const preferences = context.preferences;
  let queryLimit = preferences.get().queryLimit;
  const shell = context.shell;

  let html = 'sdqsdsqsd';

  function startup() {
    html = fs.readFileSync(path.join(__dirname, 'preview.html'), 'utf8');
    preferences.on('update', pref => { queryLimit = pref.queryLimit; });
  }

  function* search(query, res) {
    const query_trim = query.trim();
    if (query_trim.length === 0)
      return;

    const query_enc = encodeURIComponent(query);

    if (query_enc) {
      let results = yield* queryGiphy(query_trim, queryLimit);
      results = _.reject(results, (x) => x === query_trim);
      results = results.map((x) => {
        return {
          id: x['images']['original']['url'],
          payload: 'open',
          title: x['slug'],
          desc: x['images']['original']['url'],
          icon: x['images']['fixed_width_small_still']['url'],
          preview: true
        };
      });
      return res.add(results);
    } else {
      return res.add({
        id: `http://giphy.com/search/${query_enc}`,
        payload: 'goto',
        title: 'Search ' + query,
        desc: DESC
      });
    }
  }

  function execute(id, payload) {
    if (payload !== 'open')
      return;
    if (payload === 'goto') {
      return shell.openExternal(id['images']['original']['url']);
    }
    ncp.copy(id, function() {
        context.toast.enqueue('Pasted to clipboard !');
    })
  }

  function renderPreview(id, payload, render) {
    var preview = html.replace('%picture%', id);
    preview = preview.replace('%url%', id);
    render(preview);
  }

  return { startup, search: co.wrap(search), execute, renderPreview };
};
