const util = require('./util');

const apiType = `
  /* tslint:disable */

  export * from './api-typings';
`;

const apiMain = `
  import { BaseApi } from '';
  import * as API_TYPE from './api-type';

  class Api extends BaseApi {
    **apiList**
  }
  export const api = new Api();
`;

const apiPath = `
  /* tslint:disable */

  export interface Api {
    [propsName: string]: any;
  }

  const apiPaths: Api = **pathList**;
  export { apiPaths };
`;

const getApiItem = (url, type) => {
  const versionStamp = /v\d\//;
  const fnName = url
    .split(versionStamp)[1]
    .split('/')
    .map(val => {
      return util.firstUpperCase(val);
    })
    .join('');
  const paramName = fnName + 'Param';
  const responsName = fnName + 'Response';
  return `
    ${type}${fnName}(param: API_TYPE.${paramName}): Promise<API_TYPE.${responsName}> {
      return this.${type}('${url}', param)
    }
  `;
};

function handleProp(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key === 'enum' || key === 'description') {
        delete obj[key];
      }
      if (key === 'required' && Array.isArray(obj[key])) {
        obj.requiredArr = obj[key];
        delete obj[key];
      }
      if (typeof obj[key] === 'object') {
        handleProp(obj[key]);
      }
    }
  }
}

function handleRequired(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj.requiredArr && Array.isArray(obj.requiredArr)) {
        obj.requiredArr.forEach(prop => {
          if (obj.properties && obj.properties[prop]) {
            obj.properties[prop].required = true;
          }
        });
      }
      if (typeof obj[key] === 'object') {
        handleRequired(obj[key]);
      }
    }
  }
}

function handleData(obj) {
  if (!obj) {
    return obj;
  }
  handleProp(obj);
  handleRequired(obj);
  return obj;
}

function getApiList(apiList) {
  let templ = '';
  for (let i = 0; i < apiList.length; i++) {
    const item = apiList[i];
    templ += getApiItem(item.url, item.type);
  }
  return apiMain.replace('**apiList**', templ);
}

function getJsonSchema(json) {
  return apiPath.replace('**pathList**', JSON.stringify(handleData(json)));
}

module.exports = {
  apiType,
  getApiList,
  getJsonSchema
};
