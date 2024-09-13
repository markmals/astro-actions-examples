import { db, Post, User, Like, Comment, eq, inArray } from 'astro:db';

type PostSelect = typeof Post.$inferSelect;
export interface HydratedPost extends PostSelect {
    likes: { count: number; users: (typeof User.$inferSelect)[] };
    user: typeof User.$inferSelect;
    comments: (typeof Comment.$inferSelect & { user: typeof User.$inferSelect })[];
}

export async function fetchAllPosts() {
    const posts = await db.select().from(Post).innerJoin(User, eq(Post.userId, User.id));

    const comments = await db
        .select()
        .from(Comment)
        .where(
            inArray(
                Comment.postId,
                posts.map(({ Post }) => Post.id),
            ),
        )
        .innerJoin(User, eq(Comment.userId, User.id));

    const likes = await db
        .select()
        .from(Like)
        .where(
            inArray(
                Like.postId,
                posts.map(({ Post }) => Post.id),
            ),
        )
        .innerJoin(User, eq(Like.userId, User.id));

    const allPosts: HydratedPost[] = [];

    for (const { Post, User } of posts) {
        const faves = likes.filter(({ Like }) => Like.postId === Post.id);

        allPosts.push({
            ...Post,
            likes: {
                count: faves.length,
                users: faves.map(({ User }) => User),
            },
            user: User,
            comments: comments
                .filter(({ Comment }) => Comment.postId === Post.id)
                .map(({ Comment, User }) => ({ ...Comment, user: User })),
        });
    }

    const likedPosts = allPosts
        .filter(({ likes }) => likes.users.map(({ id }) => id).includes(1))
        .map((post) => post.id);

    return { allPosts, likedPosts };
}
