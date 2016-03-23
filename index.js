'use strict';

const got = require('got');
const _ = require('lodash');
const co = require('co');

const DESC = 'Search a Gif';

const query_url = 'http://api.giphy.com/v1/gifs/search?q=';
const api_key = '&api_key=dc6zaTOxFJmzC';

function* queryYoutube(query) {
  const query_enc = encodeURIComponent(query);
  const url = query_url + query_enc + api_key;
  let result = (yield got(url)).body;

  result = JSON.parse(result);
  if (result['data']) {
    return result['data'].map(x => x);
  }
  return null;
}

module.exports = (context) => {
  const shell = context.shell;

  function* search(query, res) {
    const query_trim = query.trim();
    if (query_trim.length === 0)
      return;

    const query_enc = encodeURIComponent(query);

    res.add({
      id: `http://giphy.com/search/${query_enc}`,
      payload: 'open',
      title: 'Search ' + query,
      desc: DESC
    });

    let results = yield* queryYoutube(query_trim);
    results = _.reject(results, (x) => x === query_trim);
    results = _.take(results, 5).map((x) => {
      return {
        id: x['images']['original']['url'],
        payload: 'open',
        title: x['slug'],
        desc: x['images']['original']['url'],
        icon: x['images']['fixed_width_small_still']['url']
      };
    });
    res.add(results);
  }

  function execute(id, payload) {
    if (payload !== 'open')
      return;
    shell.openExternal(id);
  }

  return {
    search: co.wrap(search),
    execute
  };
};
