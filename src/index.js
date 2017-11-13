import url from 'url';
import nodePath from 'path';
import axios from 'axios';
import fs from 'mz/fs';

const makeFileName = (uri, dir) => {
  const { host, path } = url.parse(uri);
  const fileName = `${host}${path}`.slice(0, -1).replace(/[^\w]/g, '-');
  return `${dir}${nodePath.sep}${fileName}.html`;
};

export default (uri, outputPath) => {
  const directory = outputPath ? outputPath : __dirname;
  const fullFileName = makeFileName(uri, directory);

  console.log('URL given: ', uri);
  console.log('PATH GIVEN: ', outputPath);
  console.log("Page will be saved to: ", fullFileName);

  axios.get(uri)
    .then((response) => {
      fs.writeFile(fullFileName, response.data).then((writeErr) => {
        if (writeErr) {
          throw new Error(writeErr);
        }
        console.log("Page downloaded successfully");
      })
    })
    .catch((httpErr) => {
      throw new Error(httpErr);
    })

};
