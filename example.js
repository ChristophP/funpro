const { Task } = require('./util');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// mock fetch
const fetch = () =>
  Promise.resolve({
    text: () => Promise.resolve('<p>Hello</p>'),
  });

const getRand = Task.of(Math.random);
const fetchGoogle = num => {
  return Task.of(fetch, [`google.com?${num}`]).chain(res =>
    Task.of(() => res.text())
  );
};
const writeFile = (name, content) =>
  Task.of(writeFileAsync, [name, content, 'utf8']);
const print = str => Task.of(console.log, [str]);

// get random number
// make request to google
// write file
// print finish

// export a Task
module.exports = getRand
  .chain(fetchGoogle)
  .chain(content => writeFile('pure-test.file', content))
  .chain(() => print('Done'));
