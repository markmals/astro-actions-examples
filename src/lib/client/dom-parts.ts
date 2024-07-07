export class ChildNodePart<E extends Element> {
    public constructor(public element: E) {}

    /** Set the child node of the enclosing element */
    public set<Value extends Node | string | undefined | null>(newValue: Value) {
        if (newValue !== null && newValue !== undefined) {
            if (typeof newValue === "string") {
                newValue = document.createTextNode(newValue) as any;
            }

            this.element.replaceChildren(newValue as any);
        }
    }
}

export class AttributePart<E extends Element> {
    public constructor(
        public element: E,
        public qualifiedName: keyof E | string,
        public namespace?: string,
    ) {}

    public set<Value>(newValue: Value) {
        if (newValue !== null && newValue !== undefined) {
            if (
                !(this.qualifiedName in this.element) &&
                typeof newValue !== "object" &&
                typeof newValue !== "function" &&
                typeof this.qualifiedName === "string"
            ) {
                if (this.namespace === undefined) {
                    this.element.setAttribute(this.qualifiedName, String(newValue));
                } else {
                    this.element.setAttributeNS(
                        this.namespace,
                        this.qualifiedName,
                        String(newValue),
                    );
                }
            } else {
                Reflect.set(this.element, this.qualifiedName, newValue);
            }
        }
    }
}
