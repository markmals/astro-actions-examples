import { actions } from "astro:actions";
import { LitElement, css, html, ReactiveElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { Action } from "../action";
import type { Comment } from "~/components/CommentPreview.astro";
import { repeat } from "lit/directives/repeat.js";
import { cache } from "lit/directives/cache.js";

@customElement("ui-comment-feed")
export class CommentFeedElement extends LitElement {
    // static styles = css``;

    #controller = new CommentFeedController(this);

    render() {
        return html`
            <ul role="list" class="comments">
                <slot></slot>
                ${repeat(
                    this.#controller.comments,
                    comment => comment.id,
                    comment => html`<ui-comment-preview .comment=${comment}></ui-comment-preview>`,
                )}
            </ul>

            <!-- New comment form -->
            <div class="comment-form-container">
                <img src=${this.dataset.userImage!} />
                <!-- @submit={() => (this.#controller.content = "")}
                {this.#controller.comment.enhanceForm()} -->
                <form @submit=${this.#controller.handleFormSubmission}>
                    <input type="hidden" id="postId" name="postId" value=${this.dataset.postId!} />
                    <input
                        type="hidden"
                        id="commentId"
                        name="commentId"
                        value=${this.#controller.tempCommentIdStore.id}
                    />

                    <div class="text-area-container">
                        <label for="comment" class="sr-only">Add your comment</label>
                        <textarea
                            rows="2"
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value=${this.#controller.content}
                            @input=${this.#controller.handleCommentInput}
                        ></textarea>
                    </div>

                    <div class="button-container">
                        <button type="submit" ?disabled=${this.#controller.comment.pending}>
                            Comment
                        </button>
                    </div>
                </form>
            </div>

            ${cache(
                this.#controller.comment.error
                    ? html`<ui-alert>${this.#controller.comment.error.message}</ui-alert>`
                    : nothing,
            )}
        `;
    }
}

export class UUIDStore {
    host: ReactiveElement;
    #id: string;

    constructor(host: ReactiveElement) {
        this.host = host;
        this.#id = crypto.randomUUID();
    }

    get id() {
        return this.#id;
    }

    regenerate() {
        this.#id = crypto.randomUUID();
        this.host.requestUpdate();
    }
}

export class CommentFeedController {
    host: ReactiveElement;
    comment: Action<typeof actions.comment>;
    tempCommentIdStore: UUIDStore;

    #comments: Record<string, Comment> = {};
    get comments(): Comment[] {
        return Array.from(Object.entries(this.#comments)).map(([_, comment]) => comment);
    }
    set comments(newValue: Record<string, Comment>) {
        this.#comments = newValue;
        this.host.requestUpdate();
    }

    #content = "";
    get content(): string {
        return this.#content;
    }
    set content(newValue: string) {
        this.#content = newValue;
        this.host.requestUpdate();
    }

    get newComment(): Comment | undefined {
        if (this.comment.result) {
            return {
                ...this.comment.result.Comment,
                user: this.comment.result.User,
            };
        } else if (this.comment.input && !this.comment.error) {
            return {
                id: this.tempCommentIdStore.id,
                content: this.comment.input.get("comment") as string,
                createdOn: new Date(),
                user: {
                    name: this.host.dataset.userName!,
                    image: this.host.dataset.userImage!,
                },
            };
        }

        return undefined;
    }

    constructor(host: ReactiveElement) {
        this.host = host;
        this.comment = new Action(host, actions.comment);
        this.tempCommentIdStore = new UUIDStore(host);

        // if (this.newComment) {
        //     this.comments = {
        //         ...untrack(() => this.#comments),
        //         [this.newComment.id]: this.newComment,
        //     };
        // }

        // if (!this.comment.pending) {
        //     if (this.comment.error && this.comment.input) {
        //         const commentContent = String(this.comment.input.get("comment"));

        //         const cache = untrack(() => this.#comments);
        //         delete cache[untrack(() => this.tempCommentIdStore.id)];
        //         this.comments = cache;

        //         this.#content = commentContent;
        //         this.tempCommentIdStore.regenerate();
        //     } else if (this.comment.result) {
        //         this.tempCommentIdStore.regenerate();
        //     }
        // }
    }

    public handleFormSubmission = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
        event.preventDefault();
        this.comment.submit(new FormData(event.currentTarget));
        this.content = "";
    };

    public handleCommentInput = (event: Event & { target: HTMLTextAreaElement }) =>
        (this.content = event.target.value);
}
