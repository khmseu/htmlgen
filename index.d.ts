declare type JHash = {
    [name: string]: string;
};
declare type JElement = string | JTree;
declare type JArrayElement = JHash | JElement;
declare type JArray = JArrayElement[];
interface JTree extends JArray {
    0: string;
    1: JHash;
}
export declare function div(id: string, class_: string, contents: JElement[]): JTree;
export declare function span(id: string, class_: string, contents: JElement[]): JTree;
export declare function mkhtml(tree: JElement): string[];
export declare function mergetree(tree: string | number | JTree, params: {
    [x: string]: any;
}): JElement;
export {};
