export class ErrorAlertPart {
    private static template = document.getElementById("error-alert") as HTMLTemplateElement;

    public content = (ErrorAlertPart.template.content.cloneNode(true) as DocumentFragment)
        .firstElementChild as HTMLElement;
    private label = this.content.querySelector("h3")!;

    public set message(value: string | null) {
        this.label.textContent = value;
    }
}
