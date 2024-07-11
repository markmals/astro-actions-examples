import { LitElement, ReactiveElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { Action } from "../action";
import { actions } from "astro:actions";

@customElement("ui-like-button")
export class LikeButtonElement extends LitElement {
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

    #controller = new LikeButtonController(this);

    render() {
        return html`
            <span>${this.#controller.likeCount}</span>
            <button
                ?disabled=${!this.#controller.buttonEnabled}
                @click=${this.#controller.clickButton}
            >
                ${this.#controller.buttonSymbol}
            </button>
        `;
    }
}

export class LikeButtonController {
    host: ReactiveElement;
    likes: Action<typeof actions.like>;

    #isLiked: boolean;
    get isLiked() {
        return this.#isLiked;
    }
    set isLiked(newValue: boolean) {
        this.#isLiked = newValue;
        this.host.requestUpdate();
    }

    #prevResult: number;
    get prevResult() {
        return this.#prevResult;
    }
    set prevResult(newValue: number) {
        this.#prevResult = newValue;
        this.host.requestUpdate();
    }

    get result() {
        return this.likes.result === undefined ? this.prevResult : this.likes.result;
    }

    get postId() {
        return Number(this.host.dataset.postId);
    }

    constructor(host: ReactiveElement) {
        this.host = host;
        this.likes = new Action(host, actions.like);
        this.#isLiked = Boolean(host.dataset.isLiked);
        this.#prevResult = Number(host.dataset.likeCount);
    }

    get buttonSymbol(): string {
        return this.isLiked ? "♥︎" : "♡";
    }

    get buttonEnabled(): boolean {
        return !this.likes.pending;
    }

    // Optimistic UI
    get likeCount(): string {
        if (this.likes.pending) {
            // By this time we've set isLiked to its optimistic value
            return String(this.isLiked ? this.result + 1 : this.result - 1);
        }
        return String(this.result);
    }

    clickButton = async () => {
        this.isLiked = !this.isLiked;
        await this.likes.submit({ postId: this.postId });

        if (this.likes.error) {
            this.isLiked = !this.isLiked;
        }

        if (this.likes.result !== undefined) {
            this.prevResult = this.likes.result;
        }
    };
}
