import { db, Post, User, Comment, Like, eq, and } from "astro:db";
import { faker } from "@faker-js/faker";
import { createApi as createUnsplashClient } from "unsplash-js";

const USER_COUNT = 10;
const POST_COUNT = 20;
const LIKE_MAX = 80;
const COMMENT_MAX = 52;

// Declare your Unsplash `ACCESS_KEY` in your `.env` file in order to display Unsplash
// photos in your demo feed.
const unsplash = createUnsplashClient({ accessKey: import.meta.env.ACCESS_KEY });

async function getImageUrl(query: string = "food"): Promise<string> {
    if (import.meta.env.ACCESS_KEY) {
        const search = await unsplash.search.getPhotos({
            query,
            page: Math.floor(Math.random() * 10),
        });
        const results = search.response!.results;
        const len = results.length;

        return results[Math.floor(Math.random() * len)].urls.full;
    }

    return faker.image.urlLoremFlickr();
}

export default async function seed() {
    await db.insert(User).values(
        [...Array(USER_COUNT).keys()].map(_ => ({
            name: faker.person.fullName(),
            handle: faker.internet.userName(),
            image: faker.image.avatar(),
        })),
    );

    await db.insert(Post).values(
        await Promise.all(
            [...Array(POST_COUNT).keys()].map(async () => ({
                description: faker.lorem.lines(faker.number.int({ max: 4 })),
                userId: faker.number.int({ max: USER_COUNT, min: 1 }),
                image: await getImageUrl(),
                createdOn: faker.date.recent(),
            })),
        ),
    );

    await db.insert(Comment).values(
        [...Array(faker.number.int({ max: COMMENT_MAX })).keys()].map(_ => ({
            userId: faker.number.int({ max: USER_COUNT, min: 1 }),
            postId: faker.number.int({ max: POST_COUNT, min: 1 }),
            content: faker.lorem.lines(faker.number.int({ max: 4, min: 1 })),
            createdOn: faker.date.recent(),
        })),
    );

    await db.insert(Like).values(
        await Promise.all(
            [...Array(faker.number.int({ max: LIKE_MAX })).keys()].map(async _ => {
                let userId = faker.number.int({ max: USER_COUNT, min: 1 });
                let postId = faker.number.int({ max: POST_COUNT, min: 1 });

                let isUnique = false;

                while (!isUnique) {
                    const uniqueLike = await db
                        .select()
                        .from(Like)
                        .where(and(eq(Like.userId, userId), eq(Like.postId, postId)));

                    if (uniqueLike.length === 0) {
                        isUnique = true;
                    } else {
                        userId = faker.number.int({ max: USER_COUNT, min: 1 });
                        postId = faker.number.int({ max: POST_COUNT, min: 1 });
                    }
                }

                return { userId, postId };
            }),
        ),
    );
}
