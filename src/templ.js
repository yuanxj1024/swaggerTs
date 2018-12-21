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

function getApiList(apiList) {
  let templ = '';
  for (let i = 0; i < apiList.length; i++) {
    const item = apiList[i];
    templ += getApiItem(item.url, item.type);
  }
  return apiMain.replace('**apiList**', templ);
}

module.exports = {
  apiType,
  getApiList
};
