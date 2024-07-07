import type { Coordinator } from "./coordinator";
import { ChildNodePart } from "../dom-parts";

export class ErrorAlertCoordinator implements Coordinator {
    private static template = document.getElementById("error-alert") as HTMLTemplateElement;
    private fragment = ErrorAlertCoordinator.template.content.cloneNode(true) as DocumentFragment;

    public content = this.fragment.firstElementChild as HTMLElement;

    private label = this.content.querySelector("h3")!;
    private labelPart = new ChildNodePart(this.label);

    public set message(value: string | null) {
        this.labelPart.set(value);
    }
}
