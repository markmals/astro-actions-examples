import type { Comment } from "~/components/CommentPreview.astro";
import { Formatters } from "~/lib/formatters";
import type { Coordinator } from "./coordinator";
import { AttributePart, ChildNodePart } from "../dom-parts";

export class CommentListItemCoordinator implements Coordinator {
    private static template = document.getElementById("comment-preview") as HTMLTemplateElement;
    private fragment = CommentListItemCoordinator.template.content.cloneNode(
        true,
    ) as DocumentFragment;

    public content = this.fragment.firstElementChild as HTMLElement;

    private listId = new AttributePart(this.content, "id");
    private imgSrc = new AttributePart(this.fragment.querySelector("img")!, "src");
    private spanContent = new ChildNodePart(this.fragment.querySelector("span")!);
    private dateTime = new AttributePart(this.fragment.querySelector("time")!, "datetime");
    private timeContent = new ChildNodePart(this.fragment.querySelector("time")!);
    private paragraphContent = new ChildNodePart(this.fragment.querySelector("p")!);

    private set comment(newValue: Comment) {
        this.listId.set(`comment-${newValue.id}`);
        this.imgSrc.set(newValue.user.image);
        this.spanContent.set(newValue.user.name);
        this.dateTime.set(Formatters.comment.formatAsISO(newValue.createdOn));
        this.timeContent.set(Formatters.comment.formatForDisplay(newValue.createdOn));
        this.paragraphContent.set(newValue.content);
    }

    public constructor(comment?: Comment) {
        if (comment) this.comment = comment;
    }
}
