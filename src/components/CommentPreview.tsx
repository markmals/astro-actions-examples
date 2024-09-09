import { formatters } from "../lib/formatters";

export interface Comment {
    id: string;
    content: string;
    createdOn: Date | string;
    user: {
        name: string;
        image: string;
    };
}

export function CommentPreview(props: { comment: Comment }) {
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
                    <time datetime={formatters.comment.formatAsISO(props.comment.createdOn)}>
                        {formatters.comment.formatForDisplay(props.comment.createdOn)}
                    </time>
                </div>
                <p>{props.comment.content}</p>
            </div>
        </li>
    );
}
