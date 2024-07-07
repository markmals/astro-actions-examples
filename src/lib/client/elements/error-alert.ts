// import { ActionError } from "astro:actions";

export class ErrorAlert {
    private static template = document.getElementById("error-alert") as HTMLTemplateElement;

    public content = ErrorAlert.template.content.cloneNode(true) as HTMLElement;
    private label = this.content.querySelector("h3")!;

    public set message(value: string | null) {
        this.label.textContent = value;
    }

    // public constructor(error?: ActionError) {
    //     if (error) this.message = error.message;
    // }
}
