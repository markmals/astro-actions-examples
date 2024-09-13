import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { actions } from "astro:actions";
import { ActionController } from "~/lib/action";
import { derived } from "~/lib/derived";

export
@customElement("ui-like-button")
class LikeButtonElement extends LitElement {
    likes = new ActionController(this, actions.like);

    @state()
    isLiked = Boolean(this.dataset.isLiked);

    result = derived(Number(this.dataset.likeCount), previous =>
        this.likes.result ? this.likes.result : previous,
    );

    // Optimistic UI
    get likeCount() {
        if (this.likes.pending) {
            // By this time we've set isLiked to its optimistic value
            return this.isLiked ? this.result() + 1 : this.result() - 1;
        }
        return this.result();
    }

    clickLikeButton = async () => {
        this.isLiked = !this.isLiked;
        await this.likes.submit({ postId: Number(this.dataset.postId) });

        if (this.likes.error) {
            this.isLiked = !this.isLiked;
        }
    };

    render() {
        return html`
            <span>${this.likeCount}</span>
            <button ?disabled=${this.likes.pending} @click=${this.clickLikeButton}>
                ${this.isLiked ? "♥︎" : "♡"}
            </button>
        `;
    }

    static styles = css`
        :host {
            display: flex;
            flex-direction: row;
            justify-content: start;
            align-items: center;
            gap: var(--spacing-2);
        }

        span {
            font-size: var(--font-size-sm);
            line-height: var(--font-size-sm--line-height);
        }

        button {
            color: var(--color-red-500);
        }

        button:disabled {
            opacity: 50%;
        }
    `;
}
