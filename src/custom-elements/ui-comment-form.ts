import { ActionError, actions } from "astro:actions";
import { LitElement, css, html, ReactiveElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { ActionController } from "../lib/action";
import { repeat } from "lit/directives/repeat.js";
import { cache } from "lit/directives/cache.js";
import type { HydratedPost } from "~/lib/fetch-all-posts";
import { derived } from "~/lib/derived";
import { type Comment } from "./ui-comment-preview";

import "./ui-comment-preview";
import "./ui-alert";

class CommentFormController {
    #host: ReactiveElement;
    action;

    currentUser: HydratedPost["user"];
    postId: number;
    commentId: () => string;
    comments: () => Comment[];

    constructor(host: ReactiveElement) {
        this.#host = host;
        this.action = new ActionController(host, actions.comment);

        this.currentUser = JSON.parse(host.dataset.currentUser!);
        this.postId = Number(host.dataset.postId);

        this.commentId = derived(
            host.dataset.commentId!,
            // If we're not waiting on a response and we have a result, then reset our id
            previous =>
                !this.action.pending && this.action.result ? crypto.randomUUID() : previous,
        );

        this.comments = derived<Comment[]>([], previous => {
            const haveNewError = !this.action.pending && !!this.action.error;
            if (haveNewError) {
                return previous.filter(comment => comment.id !== this.commentId());
            }

            if (this.comment) {
                return previous.some(c => c.id === this.comment?.id)
                    ? previous.map(c => (c.id === this.comment?.id ? this.comment : c))
                    : [...previous, this.comment];
            }

            return previous;
        });
    }

    get comment(): Comment | undefined {
        if (this.action.result) {
            return {
                ...this.action.result.Comment,
                user: this.action.result.User,
            };
        } else if (this.action.input && !this.action.error) {
            let currentUser = JSON.parse(this.#host.dataset.currentUser!);

            return {
                id: this.commentId(),
                content: this.action.input.get("comment") as string,
                createdOn: new Date(),
                user: {
                    name: currentUser.name,
                    image: currentUser.image,
                },
            };
        }

        return undefined;
    }

    #content = "";
    get content() {
        const haveNewError = !this.action.pending && !!this.action.error;

        if (haveNewError && this.action.input) {
            // Get previous content from the optimistic data
            // Because content.value is empty
            return this.action.input.get("comment") as string;
        }

        return this.#content;
    }
    set content(newValue) {
        this.#content = newValue;
        this.#host.requestUpdate();
    }

    handleInput(event: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
        this.content = event.currentTarget.value;
    }

    handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) {
        const isApple = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);
        const pressedModifier = isApple ? event.metaKey : event.ctrlKey;
        const pressedEnter = event.key === "Enter";

        if (pressedModifier && pressedEnter) {
            event.preventDefault();
            event.currentTarget.form?.dispatchEvent(
                new SubmitEvent("submit", {
                    bubbles: true,
                    cancelable: true,
                }),
            );
        }
    }

    get error() {
        return (this.action.error?.message ?? JSON.parse(this.#host.dataset.error ?? "")?.message)
            ?.split(":")[1]
            .trim();
    }
}

export
@customElement("ui-comment-form")
class CommentFormElement extends LitElement {
    controller = new CommentFormController(this);

    render() {
        return html`
            <ul role="list" class="comment-feed">
                <slot></slot>
                ${repeat(
                    this.controller.comments(),
                    comment => comment.id,
                    comment =>
                        html`<ui-comment-preview .comment="${comment}"></ui-comment-preview>`,
                )}
            </ul>

            <!-- New comment form -->
            <div class="form-container">
                <img src="${this.controller.currentUser.image}" />
                <form v-enhance="commentAction" @submit="${() => (this.controller.content = "")}">
                    <input
                        type="hidden"
                        id="postId"
                        name="postId"
                        value="${this.controller.postId}"
                    />
                    <input
                        type="hidden"
                        id="commentId"
                        name="commentId"
                        value="${this.controller.commentId()}"
                    />

                    <div class="content">
                        <label for="comment" class="sr-only">Add your comment</label>
                        <textarea
                            rows="2"
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value="${this.controller.content}"
                            @input="${this.controller.handleInput}"
                            @keydown="${this.controller.handleKeydown}"
                        ></textarea>
                    </div>

                    <div class="button">
                        <button type="submit" ?disabled="${this.controller.action.pending}">
                            Comment
                        </button>
                    </div>
                </form>
            </div>

            ${cache(
                this.controller.error
                    ? html`<ui-alert>${this.controller.error}</ui-alert>`
                    : nothing,
            )}
        `;
    }

    static styles = css`
        ul {
            margin-top: var(--spacing-6);
            margin-bottom: var(--spacing-6);
        }

        .form-container {
            margin-bottom: var(--spacing-3);
            margin-top: var(--spacing-6);
            display: flex;
            column-gap: var(--spacing-3);
        }

        img {
            height: var(--spacing-6);
            width: var(--spacing-6);
            flex: none;
            border-radius: var(--radius-full);
            background-color: var(--color-gray-50);
        }

        form {
            position: relative;
            flex: 1 1 auto;
        }

        .content {
            overflow: hidden;
            border-radius: var(--radius-lg);
            padding-bottom: var(--spacing-12);

            box-shadow:
                var(--ring-offset-shadow),
                inset 0 0 0 1px var(--color-gray-300),
                var(--shadow-sm);
        }

        textarea {
            display: block;
            width: 100%;
            resize: none;
            border-width: var(--spacing-0);
            background-color: transparent;
            padding-top: var(--spacing-1_5);
            padding-bottom: var(--spacing-1_5);
            color: var(--color-gray-900);
        }

        @media (min-width: 640px) {
            textarea {
                font-size: var(--font-size-sm);
                line-height: var(--line-height-6);
            }
        }

        textarea::placeholder {
            color: var(--color-gray-400);
        }

        .button {
            position: absolute;

            left: 0px;
            right: 0px;
            bottom: 0px;

            display: flex;
            justify-content: end;

            padding-top: var(--spacing-2);
            padding-bottom: var(--spacing-2);
            padding-left: var(--spacing-3);
            padding-right: var(--spacing-2);
        }

        button {
            border-radius: var(--radius-md);
            background-color: var(--spacing-4);
            padding: var(--spacing-1_5) var(--spacing-2_5);
            font-size: var(--font-size-sm);
            line-height: var(--font-size-sm--line-height);
            font-weight: 600;
            color: var(--color-gray-900);

            box-shadow:
                var(--ring-offset-shadow),
                inset 0 0 0 1px var(--color-gray-300),
                var(--shadow-sm);
        }

        button:hover {
            background-color: var(--color-gray-50);
        }

        button:disabled {
            background-color: var(--color-gray-200);
            color: var(--color-gray-600);
            box-shadow: 0 0 #0000;
        }

        button:hover:disabled {
            background-color: var(--color-gray-200);
        }
    `;
}
