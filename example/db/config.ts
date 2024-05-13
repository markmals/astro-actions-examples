import { defineDb, defineTable, column } from 'astro:db';

const User = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),

        name: column.text(),
        handle: column.text(),
        image: column.text(),
    },
});

const Post = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        userId: column.number({ references: () => User.columns.id }),

        description: column.text(),
        likes: column.number(),
        image: column.text(),
    },
});

const Comment = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        postId: column.number({ references: () => Post.columns.id }),
        userId: column.number({ references: () => User.columns.id }),

        content: column.text(),
        postedOn: column.date(),
    },
});

export default defineDb({
    tables: { User, Post, Comment },
});
