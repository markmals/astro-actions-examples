import { db, Comment, eq, User } from "astro:db";
import { getApiContext, z } from "astro:actions";
import { fetchCurrentUser } from "../lib/fetchCurrentUser";
import { sleep } from "../lib/sleep";
import { AstroError } from "astro/errors";

export const commentSchema = z.object({
    postId: z.number(),
    comment: z.string(),
});

export async function commentOnPost({ postId, comment: content }: z.infer<typeof commentSchema>) {
    // Simulate server slowness
    await sleep(1000);

    // Simulate random faiulre
    if (content.includes("a")) {
        console.error("[RANDOM COMMENT FAILURE]:", content, "includes the character 'a'");
        throw new AstroError(
            `${content} contains an 'a'. Try typing a comment without the character 'a'.`,
        );
    }

    // TODO: Log-in, log-out, & users
    const currentUser = await fetchCurrentUser(getApiContext());

    const comment = await db
        .insert(Comment)
        .values({ postId, createdOn: new Date(), userId: currentUser.id, content })
        .returning()
        .get();

    const hydratedComment = await db
        .select()
        .from(Comment)
        .where(eq(Comment.id, comment.id))
        .innerJoin(User, eq(Comment.userId, User.id))
        .get();

    return hydratedComment;
}
