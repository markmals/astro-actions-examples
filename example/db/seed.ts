import { db, Post, User, Comment } from 'astro:db';
import { faker } from '@faker-js/faker';

export default async function seed() {
    for (let _ of [...Array(10).keys()]) {
        await db.insert(User).values([
            {
                name: faker.person.fullName(),
                handle: faker.internet.userName(),
                image: faker.image.avatar(),
            },
        ]);
    }

    for (let _ of [...Array(20).keys()]) {
        await db.insert(Post).values([
            {
                description: faker.lorem.lines(faker.number.int({ max: 4 })),
                likes: faker.number.int({ max: 20 }),
                userId: faker.number.int({ max: 10 }),
                image: faker.image.urlLoremFlickr(),
            },
        ]);
    }

    for (let _ of [...Array(8).keys()]) {
        await db.insert(Comment).values([
            {
                userId: faker.number.int({ max: 10 }),
                postId: faker.number.int({ max: 20 }),
                content: faker.lorem.lines(faker.number.int({ max: 4 })),
                postedOn: faker.date.recent(),
            },
        ]);
    }
}
