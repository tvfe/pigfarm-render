'use strict';

var vm = require("vm");
var extend = require("extend");
var escape = require("./escape");

var getContentNearError = function (error, templateLines) {
    var near = '';
    try {
        var stack = error.stack.split('\n');
        var line;
        for (let stackitem of stack) {
            if (stackitem.indexOf('your-template.tpl') != -1) {
                line = stackitem.split(':')[1] - 1;
                break;
            }
        }
        near = '';
        for (var i = Math.max(0, line - 2); i < Math.min(templateLines.length, line + 3); i++) {
            near += ((i + 1) + (line == i ? ' >' : '  ') + ' | ') + templateLines[i] + '\n';
        }
    } catch (e) {
    }

    return near;
};

module.exports = function Renderer(template, helper) {
    // template helper
    var helpers = extend(escape.bind(null), helper);

    var vmTemplate = new vm.Script('(data, _)=>{with(data){return `' + template + '`}}', {
        filename: 'your-template.tpl'
    });
    vmTemplate = vmTemplate.runInThisContext();
    var vmTemplateLines = template.split('\n');

    return function (data) {
        try {
            return vmTemplate(data, helpers)
        } catch (e) {
            e.wrapper = getContentNearError(e, vmTemplateLines);
            e.kind = 'render error';

            throw e;
        }
    }
};