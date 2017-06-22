// FIXME: move this to haki?
function jsonPad(obj, depth) {
  return JSON.stringify(obj, null, 2)
    .split('\n')
    .join(`\n${new Array((depth || 0) + 1).join('  ')}`)
    .replace(/(?:\w|"|'|\}|\])$/gm, '$&,')
    .replace(/"(\$?\w+)":/g, '$1:')
    .replace(/"/g, "'")
    .replace(/\,$/, '')
}

function isUpper(str) {
  return /^[A-Z]/.test(str.charAt());
}

const TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
const PROPS = ['required', 'primaryKey', 'autoIncrement', 'hasOne', 'belongsTo'];

// TODO:
// grown g model:ctrl Admin.Databases.User app/controllers
// grown g model:views Admin.Databases.User app/views
// grown g model:routes Admin.Databases.User config/routes.js

const USAGE_INFO = `
* Attribute types are declared as {% yellow prop:type %}
* Relationships can be specified as {% yellow prop:Model %}

Examples:
  g model Account app/models id:integer:primaryKey name:string
  g model User app/models email:string account:Account

Options:
  --timestamps --paranoid
`;

module.exports = haki => {
  haki.setGenerator('model', {
    description: 'Add a named model within the given directory',
    arguments: ['NAME', 'DEST'],
    abortOnFail: true,
    usage: USAGE_INFO,
    prompts: [{
      name: 'NAME',
      message: 'Model name:',
      validate: value => value.length > 0 || "Don't forget name your model",
    }, {
      name: 'DEST',
      message: 'Destination path:',
      validate: value => value.length > 0 || "Please specify your models' path",
    }],
    actions(values, opts) {
      const _fields = [];

      const _schema = {
        type:'object',
        required: [],
        properties: {},
      };

      const _uiSchema = {
        'ui:order': ['*'],
      };

      Object.keys(opts.params).forEach(prop => {
        const obj = {};

        if (!isUpper(opts.params[prop])) {
          _fields.push({ prop });
        }

        opts.params[prop].split(':').forEach(key => {
          if (key === 'required') {
            _schema.required.push(prop);
            return;
          }

          if (isUpper(key)) {
            _schema.properties[prop] = { $ref: key };
            _uiSchema[prop] = {
              'ui:editable': true,
            };
            _uiSchema['ui:order'].unshift(prop);
            return;
          }

          if (!_uiSchema[prop]) {
            _uiSchema[prop] = { 'ui:disabled': false };
          }

          if (!_schema.properties[prop]) {
            _schema.properties[prop] = {};
          }

          if (TYPES.indexOf(key) > -1) {
            _schema.properties[prop].type = key;
          }

          if (PROPS.indexOf(key) > -1) {
            _schema.properties[prop][key] = true;
          }
        });
      });

      const MODEL_TEMPLATE = `module.exports = ${jsonPad({
        timestamps: opts.timestamps === true,
        paranoid: opts.paranoid === true,
        $schema: _schema,
        $uiSchema: _uiSchema,
        $uiFields: _fields,
      }, 0)};\n`;

      return [{
        type: 'add',
        dest: '{{{DEST}}}/{{resource NAME}}.js',
        template: MODEL_TEMPLATE,
      }];
    },
  });
};
