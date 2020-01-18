export declare type JHash = {
    [name: string]: string;
};
export declare type JElement = string | JTree;
export declare type JArrayElement = JHash | JElement;
export declare type JArray = JArrayElement[];
export interface JTree extends JArray {
    0: string;
    1: JHash;
}
export declare function div(id: string, class_: string, contents: JElement[]): JTree;
export declare function span(id: string, class_: string, contents: JElement[]): JTree;
export declare function mkhtml(tree: JElement): string[];
export declare function mergetree(tree: string | number | JTree, params: {
    [x: string]: any;
}): JElement;
