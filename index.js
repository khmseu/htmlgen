"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
function div(id, class_, contents) {
    var ret = __spreadArrays(["div", {}], contents);
    if (class_) {
        ret[1].class = class_;
    }
    if (id) {
        ret[1].id = id;
    }
    return ret;
}
exports.div = div;
function span(id, class_, contents) {
    var ret = __spreadArrays(["span", {}], contents);
    if (class_) {
        ret[1].class = class_;
    }
    if (id) {
        ret[1].id = id;
    }
    return ret;
}
exports.span = span;
var ents0 = require("html-entities");
var ents = ents0.Html4Entities;
var assert_1 = __importDefault(require("assert"));
var void_1 = __importDefault(require("html-tags/void"));
var singular = {
    "<if>": 1,
    "<!>": 1,
    "<=>": 1,
};
for (var _i = 0, voidHtmlTags_1 = void_1.default; _i < voidHtmlTags_1.length; _i++) {
    var i = voidHtmlTags_1[_i];
    singular[i] = 1;
}
function classof(obj) {
    return typeof obj === "object" ? (obj === null ? "null" : Object.getPrototypeOf(obj).constructor.name) : typeof obj;
}
function enc(s, who) {
    var s1 = String(s);
    var lines = s1.split("\n");
    lines = lines.map(ents.encode);
    return lines.join("\n");
}
// In-memory format of HTML:
// tree = 'string'
// tree = [
//   'name',
//   { attr: val, attr: val,},
//   subtree,
//   subtree,
// ]
function mkhtml(tree) {
    if (typeof tree !== "object" || !tree) {
        return [enc(tree, "tree is string")];
    }
    else if (classof(tree) === "Array" && (tree.length === 0 || classof(tree[0]) === "Array")) {
        var arr = [];
        for (var _i = 0, _a = tree; _i < _a.length; _i++) {
            var e = _a[_i];
            var res = mkhtml(e);
            arr = arr.concat(res);
        }
        return arr;
    }
    else {
        var name_1 = tree[0];
        var attrs = tree[1];
        var arr = [];
        arr.push("<", name_1);
        for (var _b = 0, _c = Object.keys(attrs).sort(); _b < _c.length; _b++) {
            var attr = _c[_b];
            arr.push(" ", attr, '="', enc(attrs[attr], "attribute value"), '"');
        }
        arr.push(">");
        switch (name_1) {
            case "<if>":
                arr = []; /* reset */
                var condition = attrs.expr;
                arr.push("<!--[if " + condition + "]>");
                for (var _d = 0, _e = tree.slice(2); _d < _e.length; _d++) {
                    var e2 = _e[_d];
                    var res = mkhtml(e2);
                    arr = arr.concat(res);
                }
                arr.push("<![endif]-->");
                break;
            case "<!>":
                assert_1.default(tree.length === 3, "Bad length, usage ['<!>', {}, 'the comment']");
                arr = ["<!-- ", enc(tree[2], "comment"), " -->"];
                break;
            case "<cdata>":
                assert_1.default(tree.length === 3, "Bad length, usage ['<cdata>', {}, 'the data']");
                var txt = tree[2];
                assert_1.default(txt.indexOf("]]>") === -1, "CDATA cannot contain ]]>");
                arr.push("<![CDATA[");
                arr.push(txt);
                arr.push("]]>");
                break;
            case "<=>":
                assert_1.default(tree.length === 3, "Bad length, usage ['<=>', {}, 'the type']");
                arr = ["<!DOCTYPE ", tree[2], ">"];
                break;
            default:
                for (var _f = 0, _g = tree.slice(2); _f < _g.length; _f++) {
                    var e2 = _g[_f];
                    var res = mkhtml(e2);
                    arr = arr.concat(res);
                }
                break;
        }
        if (!singular[name_1]) {
            arr.push("</", name_1, ">");
        }
        return arr;
    }
}
exports.mkhtml = mkhtml;
// Mergeable tree format:
// tree = 'string'
// tree = '$pname' => recurse tree params[pname]
// tree = [
//   'name',
//   { attr: val, attr: val,},
//   { attr: val, '$pname': _ } => { aname, avalue } = params[pname]
//   subtree,
//   subtree,
// ]
// Params format:
// { pname: tree, pname: attrib, }
function pget(p, params) {
    p = p.slice(1);
    var m = p.match(/^(\w+)(.*)$/);
    if (!m)
        throw Error("Bad parameter '" + p + "'");
    var ret = Function("(function(param) {\n      return params[" + m[0] + "]" + m[1] + ";\n    })")(params);
    return ret;
}
function mergetree(tree, params) {
    if (typeof tree === "string" && tree[0] === "$") {
        return mergetree(pget(tree, params), params);
    }
    if (typeof tree !== "object" || !tree) {
        return "" + tree;
    }
    else {
        var name_2 = tree[0];
        var attrs = tree[1];
        var arr = [name_2, {}];
        if (name_2[0] === "$" && tree.length === 2) {
            var p = pget(name_2, params);
            return mergetree(p, params);
        }
        for (var attr in attrs) {
            if (attr[0] === "$") {
                var p = pget(attr, params);
                arr[1][p[0]] = "" + p[1];
            }
            else {
                var v = "" + attrs[attr];
                if (v[0] === "$") {
                    var p = pget(v, params);
                    arr[1][attr] = "" + p;
                }
                else {
                    arr[1][attr] = "" + v;
                }
            }
        }
        for (var _i = 0, _a = tree.slice(2); _i < _a.length; _i++) {
            var e2 = _a[_i];
            var res = mergetree(e2, params);
            arr.push(res);
        }
        return arr;
    }
}
exports.mergetree = mergetree;
