import { formatters } from "../lib/formatters";

export type Comment = {
    content: string;
    createdOn: Date | string;
    user: {
        name: string;
        image: string;
    };
};

export interface CommentPreviewProps {
    comment: Comment;
}

export function CommentPreview(props: CommentPreviewProps) {
    return (
        <li class="comment-container">
            <div class="comment-line-container">
                <div class="comment-line"></div>
            </div>

            <img src={props.comment.user.image} class="comment-user-image" />

            <div class="comment-body">
                <div>
                    <div class="comment-user-name">
                        <span>{props.comment.user.name}</span> commented
                    </div>
                    <time datetime={new Date(props.comment.createdOn).toISOString()}>
                        {formatters.comment.formatDate(new Date(props.comment.createdOn))}
                    </time>
                </div>

                <p>{props.comment.content}</p>
            </div>
        </li>
    );
}
