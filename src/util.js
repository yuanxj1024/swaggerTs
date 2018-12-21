function firstUpperCase(str) {
  return str.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
    return $1.toUpperCase() + $2.toLowerCase();
  });
}

function handleParameters(parameters, paramKey, needTitle = true) {
  let obj = {
    type: 'object',
    required: [],
    properties: {}
  };
  if (needTitle) {
    obj = { ...obj, title: paramKey };
  }
  parameters.forEach(value => {
    if (value['in'] === 'query') {
      let key = value['name'];
      obj.properties[key] = { ...value };
      obj.additionalProperties = false;
      if (value['required']) {
        obj.required.push(key);
      }
    }
  });
  return obj;
}

function handlePaths(obj) {
  let pathsObj = {};
  var paths = obj.paths;
  for (var key in paths) {
    let pathKey = key
      .split('/')
      .map((value, index) => {
        return index > 3 ? firstUpperCase(value) : '';
      })
      .join('');
    const repKey = pathKey + 'Response';
    paths[key].post.responses[200].schema['title'] = repKey;
    paths[key].post.responses[200].schema.additionalProperties = false;
    pathsObj[repKey] = paths[key].post.responses[200].schema;

    if (paths[key].post.parameters) {
      const paramKey = pathKey + 'Param';
      pathsObj[paramKey] = handleParameters(
        paths[key].post.parameters,
        paramKey
      );
      pathsObj[paramKey].additionalProperties = false;
    }
  }
  return pathsObj;
}

function handleDefinitions(definitions) {
  for (var key in definitions) {
    if (definitions[key].properties) {
      definitions[key].additionalProperties = false;
    }
    if (typeof definitions[key] === 'object') {
      handleDefinitions(definitions[key]);
    }
  }
  return definitions;
}

module.exports = {
  handleDefinitions,
  handlePaths,
  firstUpperCase
};
