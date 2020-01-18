"use strict";

// $Id: htmlgen.ts 24 2020-01-12 15:09:51Z kai $

export type JHash = { [name: string]: string };
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
import voidHtmlTags from "html-tags/void";
import assert from "assert";

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
  let s1 = String(s);
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
    for (const attr in attrs) {
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
        arr = ["<!--", enc(tree[2], "comment"), "-->"];
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
// tree = ['$pname', _] => recurse tree params[pname]
// tree = [
//   'name',
//   { attr: val, attr: val,},
//   { attr: val, '$pname': _ } => { aname, avalue } = params[pname]
//   subtree,
//   subtree,
// ]
// Params format:
// { pname: tree, pname: attrib, }
export function mergetree(tree: string | number | JTree, params: { [x: string]: any }): JElement {
  if (typeof tree !== "object" || !tree) {
    return String(tree);
  } else {
    const name = tree[0];
    const attrs = tree[1];
    const arr: JTree = [name, {}];
    if (name[0] === "$" && tree.length === 2) {
      const p = params[name.slice(1)];
      return mergetree(p, params);
    }
    for (const attr in attrs) {
      const v = attrs[attr];
      if (attr[0] === "$") {
        const p = params[attr.slice(1)];
        arr[1][p[0]] = p[1];
      } else {
        arr[1][attr] = v;
      }
    }
    for (const e2 of tree.slice(2) as JElement[]) {
      const res = mergetree(e2, params);
      arr.push(res);
    }
    return arr;
  }
}
