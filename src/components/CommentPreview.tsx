import { formatters } from '../lib/formatters';

export interface Comment {
    id: string;
    content: string;
    createdOn: Date | string;
    user: {
        name: string;
        image: string;
    };
}

export namespace CommentPreview {
    export interface Props {
        comment: Comment;
    }
}

export function CommentPreview({ comment }: CommentPreview.Props) {
    return (
        <li className="comment-container">
            <div className="comment-line-container">
                <div className="comment-line"></div>
            </div>

            <img src={comment.user.image} className="comment-user-image" />

            <div className="comment-body">
                <div>
                    <div className="comment-user-name">
                        <span>{comment.user.name}</span> commented
                    </div>
                    <time dateTime={formatters.comment.formatAsISO(comment.createdOn)}>
                        {formatters.comment.formatForDisplay(comment.createdOn)}
                    </time>
                </div>
                <p>{comment.content}</p>
            </div>
        </li>
    );
}
