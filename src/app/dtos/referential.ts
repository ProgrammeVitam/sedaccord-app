export interface Reference {
    id: number;
    name: string;
}

export interface ClassificationItemNode extends Reference {
    children?: this[];
}

export interface Agency extends Reference {
    description: string;
}
