import { db, Comment, eq, User } from "astro:db";
import { ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { fetchCurrentUser } from "../lib/fetchCurrentUser";
import { delay } from "@std/async";

export const commentSchema = z.object({
    postId: z.number(),
    commentId: z.string(),
    comment: z.string(),
});

export async function commentOnPost(
    { postId, commentId, comment: content }: z.infer<typeof commentSchema>,
    context: ActionAPIContext,
) {
    // Simulate server slowness
    await delay(1000);

    // Simulate random faiulre
    if (content.includes("a")) {
        console.error(
            `[RANDOM COMMENT FAILURE]: '${content}' contains an 'a'. Try typing a comment without the character 'a'.`,
        );
        throw new ActionError({
            code: "FORBIDDEN",
            message: `'${content}' contains an 'a'. Try typing a comment without the character 'a'.`,
        });
    }

    // TODO: Log-in, log-out, & users
    const currentUser = await fetchCurrentUser(context);

    await db
        .insert(Comment)
        .values({ id: commentId, postId, createdOn: new Date(), userId: currentUser.id, content });

    const hydratedComment = await db
        .select()
        .from(Comment)
        .where(eq(Comment.id, commentId))
        .innerJoin(User, eq(Comment.userId, User.id))
        .get();

    return hydratedComment;
}
