import { defineDb, defineTable, column } from "astro:db";

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
        userId: column.number({ references: () => User.columns.id, optional: false }),

        description: column.text(),
        image: column.text(),
        createdOn: column.date(),
    },
});

const Like = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        postId: column.number({ references: () => Post.columns.id, optional: false }),
        userId: column.number({ references: () => User.columns.id, optional: false }),
    },
});

const Comment = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        postId: column.number({ references: () => Post.columns.id, optional: false }),
        userId: column.number({ references: () => User.columns.id, optional: false }),

        content: column.text(),
        createdOn: column.date(),
    },
});

export default defineDb({
    tables: { User, Post, Like, Comment },
});
