<script module lang="ts">
    export interface Comment {
        id: string;
        content: string;
        createdOn: Date | string;
        user: {
            name: string;
            image: string;
        };
    }

    export interface Props {
        comment: Comment;
    }
</script>

<script lang="ts">
    import { formatters } from "../lib/formatters";
    let { comment }: Props = $props();
</script>

<li class="comment-container">
    <div class="comment-line-container">
        <div class="comment-line"></div>
    </div>

    <!-- svelte-ignore a11y_missing_attribute -->
    <img src={comment.user.image} class="comment-user-image" />

    <div class="comment-body">
        <div>
            <div class="comment-user-name">
                <span>{comment.user.name}</span> commented
            </div>
            <time datetime={formatters.comment.formatAsISO(comment.createdOn)}>
                {formatters.comment.formatForDisplay(comment.createdOn)}
            </time>
        </div>
        <p>{comment.content}</p>
    </div>
</li>
