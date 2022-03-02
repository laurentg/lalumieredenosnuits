// basic build

'use strict';

function resource_plugin(options) {
  return function (files, metalsmith, done) {
    let metadata = metalsmith.metadata();
    let listing = metadata[options.listing];
    if (listing) {
      let resources = new Map();
      for (let file in files) {
        let filename = file.substring(file.lastIndexOf('/') + 1);
        let id = filename.replace(/^([^-\s]+)[-\s].*$/, "$1").toUpperCase();
        let ext = filename.replace(/^.*\.([^.]+)$/, "$1").toLowerCase();
        let isimage = ext == 'jpg' || ext == 'jpeg';
        let ispdf = ext == 'pdf';
        if (isimage || ispdf) {
          let rscs = resources.get(id);
          if (!rscs) {
            rscs = [];
            resources.set(id, rscs);
          }
          let rsc = {
            filename: file,
            ext: ext,
            isimage: isimage,
            ispdf: ispdf
          }
          rscs.push(rsc);
          rscs.sort((a, b) => a.filename.localeCompare(b.filename));
        }
      }
      for (let i in listing) {
        i = parseInt(i);
        let e = listing[i];
        let ePrev = i == 0 ? null : listing[i - 1];
        let eNext = i == listing.length - 1 ? null : listing[i + 1];
        let rscs = resources.get(e.id);
        if (!rscs) {
          console.log("Attention: Légende ID " + e.id + ": pas de ressources. (" + e.titre + ")");
        } else {
          files['resource_' + e.id + '.html'] = {
            id: e.id,
            previd: ePrev == null ? null : ePrev.id,
            nextid: eNext == null ? null : eNext.id,
            titre: e.titre,
            index: i,
            legende: e.legende,
            contents: '',
            layout: 'resource.hbs',
            resources: rscs
          };
          resources.delete(e.id);
        }
      }
      resources.forEach((v, k) => {
          console.log("Attention: Ressource ID " + k + ": pas de légende.");
      });
    }
    done();
  }
}


const Metalsmith = require('metalsmith'),
  markdown = require('@metalsmith/markdown'),
  layouts = require('@metalsmith/layouts'),
  assets = require('metalsmith-assets'),
  mcsv = require('metalsmith-csv'),
  writemetadata = require('metalsmith-writemetadata'),
  collections = require('metalsmith-collections');

Metalsmith(__dirname)
  .clean(true)
  .use(mcsv({
    files: ['legendes.csv']
  }))
  .use(resource_plugin({
    listing: 'legendes'
  }))
  .use(collections({
    pages: {
      pattern: 'resource_*.html',
      sortBy: function(a, b) {
        return a.index - b.index;
      }
    }
  }))
  .use(markdown())
  .use(layouts())
//  .use(assets({
//    source: './src/assets/',
//    destination: './'
//  }))
  .build(function (err) {
    if (err) throw err;
  });