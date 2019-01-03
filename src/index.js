const fs = require('fs-extra');
const download = require('download');
const readline = require('readline');
const jsonToTs = require('json-schema-to-typescript');
const refParse = require('json-schema-ref-parser');
const util = require('./util');
const templ = require('./templ');

let swaggerConf = {
  url: '',
  date: new Date().getTime()
};

const confFile = '.swagger.conf';
const swaggerFile = 'swagger.json';
const apiListFile = './api.ts';
const apiTypeFile = './api-type.ts';
const apiTypingsFile = './api-typings.ts';
const apiPathFile = './api-paths.ts';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getSwaggerApi = () => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(confFile)) {
      rlResolve(resolve);
      return;
    }
    const conf = fs.readJSONSync(confFile);
    if (!conf.url) {
      rlResolve(resolve);
      return;
    }
    swaggerConf.url = conf.url;
    resolve(swaggerConf.url);
  });
};

const writeJsonSchema = api => {
  const pathObj = util.getJsonSchema(api);
  const defs = api['definitions'];

  refParse.dereference(
    {
      definitions: { ...defs },
      paths: { ...pathObj }
    },
    (err, json) => {
      fs.writeFileSync(apiPathFile, templ.getJsonSchema(json));
    }
  );
};

const writeApiList = paths => {
  let apiList = [];
  for (const key in paths) {
    apiList.push({
      url: key,
      type: paths[key].post ? 'post' : 'get'
    });
  }
  if (!fs.existsSync(apiListFile)) {
    fs.outputFileSync(apiListFile, templ.getApiList(apiList));
  }
};

function rlResolve(resolve) {
  rl.question('输入文档地址:', answer => {
    swaggerConf.url = answer;
    resolve(answer);
  });
}

getSwaggerApi()
  .then(url => {
    return download(url);
  })
  .then(data => {
    return fs.outputFile(swaggerFile, data);
  })
  .then(() => {
    return fs.readJSON(swaggerFile);
  })
  .then(api => {
    console.log('--- 编译中 ---');

    writeApiList(api['paths']);
    writeJsonSchema(api);

    return api;
  })
  .then(api => {
    return jsonToTs.compile(
      {
        title: 'rootList',
        type: 'object',
        properties: { ...util.handlePaths(api) },
        definitions: util.handleDefinitions(api.definitions),
        additionalProperties: false
      },
      ''
    );
  })
  .then(interfaces => {
    console.log('--- 生成中 ---');
    return fs.outputFile(apiTypingsFile, interfaces);
  })
  .then(() => {
    if (!fs.existsSync(apiTypeFile)) {
      return fs.outputFile(apiTypeFile, templ.apiType);
    }
  })
  .then(() => {
    if (!fs.existsSync(confFile)) {
      fs.outputJSONSync(confFile, swaggerConf);
    }
    console.log('success!');
    process.exit();
  });
