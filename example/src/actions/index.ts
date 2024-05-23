import { defineAction, z } from "astro:actions";
import { likePost, likeSchema } from "./like";
import { commentOnPost, commentSchema } from "./comment";

export const server = {
    like: defineAction({
        input: likeSchema,
        async handler(input) {
            return await likePost(input);
        },
    }),
    comment: defineAction({
        accept: "form",
        input: commentSchema,
        async handler(input) {
            return await commentOnPost(input);
        },
    }),
};
