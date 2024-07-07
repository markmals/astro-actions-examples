import { actions } from "astro:actions";
import { Action, effect, State, Computed } from "../signals";

export class LikeButtonModel {
    private likes = new Action(actions.like);

    private isLiked: State<boolean>;
    private prevResult: State<number>;
    private result: Computed<number>;

    public constructor(
        private dataset: DOMStringMap,
        { signal }: { signal: AbortSignal },
    ) {
        this.isLiked = new State(Boolean(this.dataset.isLiked));
        this.prevResult = new State(Number(this.dataset.likeCount));
        this.result = new Computed(() =>
            this.likes.result === undefined ? this.prevResult.get() : this.likes.result,
        );

        effect(
            () => {
                if (this.likes.result !== undefined) {
                    this.prevResult.set(this.likes.result);
                }
            },
            { signal },
        );
    }

    public get buttonSymbol(): string {
        return this.isLiked.get() ? "♥︎" : "♡";
    }

    public get buttonEnabled(): boolean {
        return !this.likes.pending;
    }

    // Optimistic UI
    public get likeCount(): string {
        if (this.likes.pending) {
            // By this time we've set isLiked to its optimistic value
            return String(this.isLiked.get() ? this.result.get() + 1 : this.result.get() - 1);
        }
        return String(this.result.get());
    }

    public clickButton = async () => {
        this.isLiked.set(!this.isLiked.get());
        await this.likes.submit({ postId: Number(this.dataset.postId) });

        if (this.likes.error) {
            this.isLiked.set(!this.isLiked.get());
        }
    };
}
