jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),name = locals_.name,summary = locals_.summary;
buf.push("<h3>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</h3><p>" + (null == (jade.interp = summary) ? "" : jade.interp) + "</p><p>&nbsp;</p><button type=\"button\" class=\"btn btn-default pull-right\">Close</button><p>&nbsp;</p>");;return buf.join("");
}module.exports = template;