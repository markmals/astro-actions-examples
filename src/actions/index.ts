import { defineAction } from "astro:actions";
import { likePost, likeSchema } from "./like";
import { commentOnPost, commentSchema } from "./comment";

export const server = {
    like: defineAction({
        accept: "json",
        input: likeSchema,
        async handler(input, context) {
            return await likePost(input, context);
        },
    }),
    comment: defineAction({
        accept: "form",
        input: commentSchema,
        async handler(input, context) {
            return await commentOnPost(input, context);
        },
    }),
};
