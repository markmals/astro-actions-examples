import type { Comment } from "~/components/CommentPreview.astro";
import { Formatters } from "~/lib/formatters";

export class CommentListItemPart {
    private static template = document.getElementById("comment-preview") as HTMLTemplateElement;
    private fragment = CommentListItemPart.template.content.cloneNode(true) as DocumentFragment;

    private list = this.fragment.firstElementChild as HTMLLIElement;
    private img = this.fragment.querySelector("img")!;
    private span = this.fragment.querySelector("span")!;
    private time = this.fragment.querySelector("time")!;
    private paragraph = this.fragment.querySelector("p")!;

    private set comment(newValue: Comment) {
        this.list.setAttribute("id", `comment-${newValue.id}`);
        this.img.src = newValue.user.image;
        this.span.textContent = newValue.user.name;
        this.time.dateTime = Formatters.comment.formatAsISO(newValue.createdOn);
        this.time.textContent = Formatters.comment.formatForDisplay(newValue.createdOn);
        this.paragraph.textContent = newValue.content;
    }

    public get content() {
        return this.list;
    }

    public constructor(comment?: Comment) {
        if (comment) this.comment = comment;
    }
}
