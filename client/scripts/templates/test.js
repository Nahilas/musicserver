jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),name = locals_.name;
buf.push("<p>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</p>");;return buf.join("");
}module.exports = template;