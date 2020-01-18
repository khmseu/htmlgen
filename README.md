# htmlgen
Generate HTML from JSON or javascript objects and arrays

Generally, a tree, also known as an element, looks like this:

    [
        'a'.
        { href: 'http://example.com' },
        'This is an example',
        [ 'br', {} ]
        'link &<stuff>'
    ]
for `<a href="http://example.com">This is an example<br>link &amp;&lt;stuff&gt;</a>`

Internal types:

    type JHash = { [name: string]: string };    // describes attributes
    type JElement = string | JTree;             // text or a full element
    type JArrayElement = JHash | JElement;      // these can appear in
    type JArray = JArrayElement[];              // a full element
    interface JTree extends JArray {            // in a specific order
      0: string;
      1: JHash;
      // default: JElement;
    }
----
The following are exported:

    function div(id: string, class_: string, contents: JElement[]) 
Build a `<div>` element.

    function span(id: string, class_: string, contents: JElement[])
Build a `<span>` element.

    // In-memory format of HTML:
    // tree = 'string'
    // tree = [
    //   'name',
    //   { attr: val, attr: val,},
    //   subtree,
    //   subtree,
    // ]
    function mkhtml(tree: JElement): string[]
Convert an element tree into a string array (`.join('')` to make an HTML string)

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
    function mergetree(tree: string | number | JTree, params: { [x: string]: any }): JElement
Convert a tree with placeholders, replacing those with parameters
