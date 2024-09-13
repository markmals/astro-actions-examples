import { db, and, eq, Like } from "astro:db";
import { delay } from "@std/async";
import { type ActionAPIContext, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { fetchCurrentUser } from "~/lib/fetch-current-user";

export const likeSchema = z.object({ postId: z.number() });

export async function likePost({ postId }: z.infer<typeof likeSchema>, context: ActionAPIContext) {
    // Simulate server slowness
    await delay(1000);

    // Simulate random faiulre
    if (Math.random() < 0.1) {
        console.error("[RANDOM LIKE FAILURE]:", postId, "cannot be liked... for random reasons");
        throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            // FIXME:
            message: "",
        });
    }

    const sqlFilter = and(eq(Like.postId, postId), eq(Like.userId, 1));

    // TODO: Log-in, log-out, & users
    const currentUser = await fetchCurrentUser(context);

    const existingLike = await db.select().from(Like).where(sqlFilter).get();

    if (existingLike) {
        await db.delete(Like).where(sqlFilter);
    } else {
        await db.insert(Like).values({ postId, userId: currentUser.id });
    }

    const likes = await db.select().from(Like).where(eq(Like.postId, postId));
    const likeCount = likes.length;

    return likeCount;
}
