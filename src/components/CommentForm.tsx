import { ActionError, actions } from 'astro:actions';
import { useAction } from '../lib/action';
import type { HydratedPost } from '../lib/fetchAllPosts';
import { CommentPreview, type Comment } from './CommentPreview';
import { Alert } from './Alert';
import {
    useRef,
    useState,
    type FormEventHandler,
    type KeyboardEventHandler,
    type PropsWithChildren,
} from 'react';
import { useDerived } from '../lib/derived';

export namespace CommentForm {
    export interface Props extends PropsWithChildren {
        currentUser: HydratedPost['user'];
        postId: number;
        commentId: ReturnType<typeof crypto.randomUUID>;
        error?: ActionError<any>;
    }
}

export function CommentForm(props: CommentForm.Props) {
    const [commentAction, { Form }] = useAction(actions.comment);

    const initialCommentId = useRef(props.commentId);
    // If we're not waiting on a response and we have a result, then reset our id
    const commentId =
        !commentAction.pending && commentAction.result
            ? crypto.randomUUID()
            : initialCommentId.current;

    initialCommentId.current = commentId;

    let comment: Comment | undefined = undefined;
    if (commentAction.result) {
        comment = {
            ...commentAction.result.Comment,
            user: commentAction.result.User,
        };
    } else if (commentAction.input && !commentAction.error) {
        comment = {
            id: commentId,
            content: commentAction.input.get('comment') as string,
            createdOn: new Date(),
            user: {
                name: props.currentUser.name,
                image: props.currentUser.image,
            },
        };
    }

    const haveNewError = !commentAction.pending && commentAction.error;

    const initialComments = useRef<Comment[]>([]);
    let comments = initialComments.current;

    const [content, setContent] = useState('');
    let displayedContent = content;

    if (haveNewError) {
        comments = comments.filter((comment) => comment.id !== commentId);

        if (commentAction.input) {
            // Get previous content from the optimistic data
            // Because content is empty
            displayedContent = commentAction.input.get('comment') as string;
        }
    }

    if (comment) {
        comments = comments.some((c) => c.id === comment.id)
            ? comments.map((comment) => (comment.id === comment.id ? comment : comment))
            : [...comments, comment];
    }

    const handleInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
        setContent(event.currentTarget.value);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
        const isApple = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);
        const pressedModifier = isApple ? event.metaKey : event.ctrlKey;
        const pressedEnter = event.key === 'Enter';

        if (pressedModifier && pressedEnter) {
            event.preventDefault();
            event.currentTarget.form?.dispatchEvent(
                new SubmitEvent('submit', {
                    bubbles: true,
                    cancelable: true,
                }),
            );
        }
    };

    const error = (commentAction.error?.message ?? props.error?.message)?.split(':')[1].trim();

    return (
        <>
            <ul role="list" className="comments">
                {/* Server-rendered comments */}
                {props.children}
                {/* Client-rendered comments */}
                {comments.map((comment) => (
                    <CommentPreview key={comment.id} comment={comment} />
                ))}
            </ul>

            {/* New comment form */}
            <div className="comment-form-container">
                <img src={props.currentUser.image} />
                <Form
                    onSubmit={() => {
                        setContent('');
                    }}
                >
                    <input type="hidden" id="postId" name="postId" value={props.postId} />
                    <input type="hidden" id="commentId" name="commentId" value={commentId} />

                    <div className="text-area-container">
                        <label htmlFor="comment" className="sr-only">
                            Add your comment
                        </label>
                        <textarea
                            rows={2}
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value={displayedContent}
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                        ></textarea>
                    </div>

                    <div className="button-container">
                        <button type="submit" disabled={commentAction.pending}>
                            Comment
                        </button>
                    </div>
                </Form>
            </div>

            {error && <Alert>{error}</Alert>}
        </>
    );
}
