export interface Reference {
    id: number;
    name: string;
}

interface ClassificationItemNode extends Reference {
    children?: this[];
}

export type Classification = ClassificationItemNode[];

export interface Agency extends Reference {
    description: string;
}
