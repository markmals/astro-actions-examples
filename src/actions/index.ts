import { defineAction } from "astro:actions";
import { likePost, likeSchema } from "./like";
import { commentOnPost, commentSchema } from "./comment";

export const server = {
    like: defineAction({
        input: likeSchema,
        async handler(input, ctx) {
            return await likePost(input, ctx);
        },
    }),
    comment: defineAction({
        accept: "form",
        input: commentSchema,
        async handler(input, ctx) {
            return await commentOnPost(input, ctx);
        },
    }),
};
