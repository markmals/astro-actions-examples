import { actions } from "astro:actions";
import type { Comment } from "~/components/CommentPreview.astro";
import { UUIDStore, Action, effect, State, Computed, untrack } from "../signals";

export class CommentFeedModel {
    public comment = new Action(actions.comment);
    public tempCommentIdStore = new UUIDStore();

    #cachedComments = new State<Record<string, Comment>>({});
    #comments = new Computed(() =>
        Array.from(Object.entries(this.#cachedComments.get())).map(([_, comment]) => comment),
    );

    public get comments() {
        return this.#comments.get();
    }

    #content = new State("");
    public get content(): string {
        return this.#content.get();
    }

    public get newComment(): Comment | undefined {
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
                    name: this.dataset.userName!,
                    image: this.dataset.userImage!,
                },
            };
        }

        return undefined;
    }

    public constructor(
        private dataset: DOMStringMap,
        { signal }: { signal: AbortSignal },
    ) {
        effect(
            () => {
                if (this.newComment) {
                    this.#cachedComments.set({
                        ...untrack(() => this.#cachedComments.get()),
                        [this.newComment.id]: this.newComment,
                    });
                }
            },
            { signal },
        );

        effect(
            () => {
                if (!this.comment.pending) {
                    if (this.comment.error && this.comment.input) {
                        let commentContent = String(this.comment.input.get("comment"));

                        this.#cachedComments.set(
                            untrack(() => {
                                let cache = this.#cachedComments.get();
                                delete cache[this.tempCommentIdStore.id];
                                return cache;
                            }),
                        );

                        this.#content.set(commentContent);
                        this.tempCommentIdStore.regenerate();
                    } else if (this.comment.result) {
                        this.tempCommentIdStore.regenerate();
                    }
                }
            },
            { signal },
        );
    }

    public handleFormSubmission = (async (
        event: SubmitEvent & { currentTarget: HTMLFormElement },
    ) => {
        event.preventDefault();
        this.comment.submit(new FormData(event.currentTarget));
        this.#content.set("");
    }) as (event: SubmitEvent) => Promise<void>;

    public handleCommentInput = ((event: Event & { target: HTMLTextAreaElement }) =>
        this.#content.set(event.target.value)) as (event: Event) => void;
}
