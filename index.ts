"use strict";

// $Id: htmlgen.ts 24 2020-01-12 15:09:51Z kai $

export type JHash = { [name: string]: string | number | string[] };
export type JElement = string | JTree;
export type JArrayElement = JHash | JElement;
export type JArray = JArrayElement[];
export interface JTree extends JArray {
  0: string;
  1: JHash;
  // default: JElement;
}

export function div(id: string, class_: string, contents: JElement[]) {
  let ret: JTree = ["div", {}, ...contents];
  if (class_) {
    ret[1].class = class_;
  }
  if (id) {
    ret[1].id = id;
  }
  return ret;
}
export function span(id: string, class_: string, contents: JElement[]) {
  let ret: JTree = ["span", {}, ...contents];
  if (class_) {
    ret[1].class = class_;
  }
  if (id) {
    ret[1].id = id;
  }
  return ret;
}

import ents0 = require("html-entities");
const ents = ents0.Html4Entities;
import assert from "assert";
import voidHtmlTags from "html-tags/void";

const singular: { [s: string]: 1 } = {
  "<if>": 1,
  "<!>": 1,
  "<=>": 1,
};
for (let i of voidHtmlTags) {
  singular[i] = 1;
}

function classof(obj: any) {
  return typeof obj === "object" ? (obj === null ? "null" : Object.getPrototypeOf(obj).constructor.name) : typeof obj;
}

function enc(s: any, who: string) {
  let s1;
  if (Array.isArray(s)) s1 = s.join(" ");
  else s1 = String(s);
  let lines = s1.split("\n");
  lines = lines.map((ents as any).encode);
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
export function mkhtml(tree: JElement): string[] {
  // console.log("mkhtml", { tree });
  if (typeof tree !== "object" || !tree) {
    return [enc(tree, "tree is string")];
  } else if (classof(tree) === "Array" && (tree.length === 0 || classof(tree[0]) === "Array")) {
    let arr: string[] = [];
    for (const e of tree as JElement[]) {
      const res = mkhtml(e);
      arr = arr.concat(res);
    }
    return arr;
  } else {
    const name = tree[0];
    const attrs = tree[1];
    let arr: string[] = [];
    arr.push("<", name);
    for (const attr of Object.keys(attrs).sort()) {
      arr.push(" ", attr, '="', enc(attrs[attr], "attribute value"), '"');
    }
    arr.push(">");
    switch (name) {
      case "<if>":
        arr = []; /* reset */
        let condition = attrs.expr;
        arr.push("<!--[if " + condition + "]>");
        for (const e2 of tree.slice(2) as JElement[]) {
          const res = mkhtml(e2);
          arr = arr.concat(res);
        }
        arr.push("<![endif]-->");
        break;
      case "<!>":
        assert(tree.length === 3, "Bad length, usage ['<!>', {}, 'the comment']");
        arr = ["<!-- ", enc(tree[2], "comment"), " -->"];
        break;
      case "<cdata>":
        assert(tree.length === 3, "Bad length, usage ['<cdata>', {}, 'the data']");
        const txt = tree[2] as string;
        assert(txt.indexOf("]]>") === -1, "CDATA cannot contain ]]>");
        arr.push("<![CDATA[");
        arr.push(txt);
        arr.push("]]>");
        break;
      case "<=>":
        assert(tree.length === 3, "Bad length, usage ['<=>', {}, 'the type']");
        arr = ["<!DOCTYPE ", tree[2] as string, ">"];
        break;
      default:
        // console.log({ tree });
        for (const e2 of tree.slice(2) as JElement[]) {
          const res = mkhtml(e2);
          arr = arr.concat(res);
        }
        break;
    }
    if (!singular[name]) {
      arr.push("</", name, ">");
    }
    return arr;
  }
}

// Mergeable tree format:
// tree = 'string'
// tree = '$pname' => recurse tree params[pname]
// tree = ['$pname', _] => recurse tree params[pname]
// tree = [
//   'name',
//   { attr: val, attr: val,},
//   { attr: val, '$pname': _ } => { aname, avalue } = params[pname]
//   { attr: val, attr: '$pname' } => { aname, avalue } = { aname, params[pname] }
//   subtree,
//   subtree,
// ]
// Params format:
// { pname: tree, pname: attrib, }
function pget(p: string, params: { [x: string]: any }, where: string): any {
  const p1 = p.slice(1);
  const func = `"use strict"; return (params) => { return params.${p1}; }`;
  const F = Function(func);
  const FF = F();
  const ret = FF(params);
  // console.log("pget", { where, params, p, p1, func, F, FF, ret });
  return ret;
}

function getAttr(attrVal: string | number | any[]) {
  let v0 = Array.isArray(attrVal) ? attrVal.join(" ") : attrVal;
  const v = `${v0}`;
  return v;
}

export function mergetree(tree: string | number | JTree, params: { [x: string]: any }): JElement {
  // console.log("mergetree", { tree });
  if (typeof tree === "string" && tree[0] === "$") {
    return mergetree(pget(tree, params, "$tree"), params);
  } else if (typeof tree !== "object" || !tree) {
    return `${tree}`;
  } else {
    const name = tree[0];
    if (name[0] === "$" && tree.length === 2) {
      const p = pget(name, params, "[$name,_]");
      return mergetree(p, params);
    }
    const arr: JTree = [name, {}];
    const attrs = tree[1];
    // console.log("mergetree:preattr", { arr, attrs });
    for (const attr in attrs) {
      if (attr[0] === "$") {
        const p = pget(attr, params, "$attr=_");
        arr[1][p[0]] = getAttr(p[1]);
      } else {
        let v = getAttr(attrs[attr]);
        if (v[0] === "$") {
          const p = pget(v, params, "attr=$");
          arr[1][attr] = getAttr(p);
        } else {
          arr[1][attr] = v;
        }
      }
    }
    // console.log("mergetree:postattr", { arr, attrs });
    for (const e2 of tree.slice(2) as JElement[]) {
      const res = mergetree(e2, params);
      arr.push(res);
    }
    // console.log("mergetree:return", { arr });
    return arr;
  }
}
