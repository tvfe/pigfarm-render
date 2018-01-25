'use strict';

var escape = require("./escape");
var vm = require("vm");
var extend = require('extend')

var getContentNearError = function (error, templateLines) {
    var near = '';
    try {
        var stack = error.stack.split('\n');
        var line;
        for (var i = 0; i < stack.length; i++) {
            var stackitem = stack[i];
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

    try {
        var vmTemplate = new vm.Script('(data, _)=>{with(data){return `' + template + '`}}', {
            filename: 'your-template.tpl'
        });
        vmTemplate = vmTemplate.runInThisContext();
    } catch(e) {
        e.wrapper = 'pigfarm-render: template compile error';
        throw e
    }
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