jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),widthPercent = locals_.widthPercent,id = locals_.id;
buf.push("<div" + (jade.attr("style", "width:" + widthPercent, true, false)) + (jade.attr("data-id", id, true, false)) + " class=\"letter\">" + (jade.escape(null == (jade.interp = id) ? "" : jade.interp)) + "</div>");;return buf.join("");
}module.exports = template;