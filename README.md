# htmlgen
Generate HTML from JSON or javascript objects and arrays


type JHash = { [name: string]: string };
type JElement = string | JTree;
type JArrayElement = JHash | JElement;
type JArray = JArrayElement[];
interface JTree extends JArray {
  0: string;
  1: JHash;
  // default: JElement;
}



function div(id: string, class_: string, contents: JElement[]) {

export function span(id: string, class_: string, contents: JElement[]) {

// In-memory format of HTML:
// tree = 'string'
// tree = [
//   'name',
//   { attr: val, attr: val,},
//   subtree,
//   subtree,
// ]
export function mkhtml(tree: JElement): string[] {


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