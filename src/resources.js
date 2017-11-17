import url from 'url';
import nodePath from 'path';
import fs from 'mz/fs';
import cheerio from 'cheerio';
import { makeName, getResponse, writeToFile } from './common';

/*
eslint no-shadow: ["error", { "allow": ["data", "url", "fileName", "error"] }]
*/
/*
eslint-env es6
*/

const getLinks = (html, selector, predicate) => {
  const $ = cheerio.load(html);
  return $(selector).toArray()
    .map((el) => {
      return { type: el.name, src: el.attribs.src };
    })
    .filter((el) => !predicate.test(el.src));
};

const updateLinks = (linksColl, dirName) => {
  return linksColl.reduce((acc, el) => {
    const {root, dir, ext, name} = nodePath.parse(el.src);
    const newName = `${(nodePath.join(dir, name).replace(/\W/g, '-')).slice(1)}${ext}`;
      el.localSrc = nodePath.format({
      root: '/ignored',
      dir: dirName,
      base: newName,
      ext: 'ignored',
    });
    el.fileName = newName;
    return [...acc, el];
  }, []);
};

const updateHtml = (html, linksColl) => {
  const result = linksColl.reduce((acc, el) => {
    const $ = cheerio.load(acc);
    $(`[src="${el.src}"]`).removeAttr('src').attr('src', el.localSrc);
    return $.html();
  }, html);

  return `${result}\n`;
};

const fetchResources = (response, url, outputDir) => {
  const resourcesDir = makeName(url, outputDir, '_files');
  const htmlFileName = makeName(url, outputDir, '.html');

  return response
    .then(html => {
      const linksColl = getLinks(html, '[src]', /^(\w+:)?\/{2,}/);
      const updatedLinksColl = updateLinks(linksColl, resourcesDir);
      const updatedHtml = updateHtml(html, updatedLinksColl);
      return { html: updatedHtml, links: updatedLinksColl };
    })
    .then(result => {
      const preparedData = [
        {type: 'text', data: Promise.resolve(result.html), location: htmlFileName},
      ];
      return result.links.reduce((acc, el) => {
        const responseType = el.type === 'img' ? 'stream' : '';
        const uri = `${url}${el.src}`;
        const resp = getResponse(uri, responseType);
        const updatedEl = {
          type: el.type,
          data: resp,
          location: `${resourcesDir}${nodePath.sep}${el.fileName}`;
        };
        return [...acc, updatedEl];
      }, preparedData);
    })
    .catch(error => console.log(error.message));
};

const saveData = (coll) => {
  return Promise.all(coll.map(el => writeToFile(el.data, el.location, el.type);
};

export {getLinks, fetchResources, updateLinks, updateHtml, saveData};
