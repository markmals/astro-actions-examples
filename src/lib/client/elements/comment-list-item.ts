import type { Comment } from "~/components/CommentPreview.astro";
import { Formatters } from "~/lib/formatters";

export class CommentListItemElement extends HTMLLIElement {
    constructor(comment: Comment) {
        super();

        let template = document.getElementById("comment-preview") as HTMLTemplateElement;
        let fragment = template.content.cloneNode(true) as DocumentFragment;

        let list = fragment.firstElementChild as HTMLLIElement;
        list.setAttribute("id", `comment-${comment.id}`);

        let img = fragment.querySelector("img")!;
        img.src = comment.user.image;

        let span = fragment.querySelector("span")!;
        span.textContent = comment.user.name;

        let time = fragment.querySelector("time")!;
        time.dateTime = Formatters.comment.formatAsISO(comment.createdOn);
        time.textContent = Formatters.comment.formatForDisplay(comment.createdOn);

        let paragraph = fragment.querySelector("p")!;
        paragraph.textContent = comment.content;

        return list;
    }
}
