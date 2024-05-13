import { defineAction, z } from 'astro:actions';
import { likes } from '../lib/fake-db';
import { sleep } from '../lib/sleep';
import { AstroError } from 'astro/errors';

export const server = {
    newsletter: defineAction({
        accept: 'form',
        input: z.object({
            email: z.string().email(),
            receivePromo: z.boolean(),
        }),
        handler: async ({ email, receivePromo }) => {
            console.log('email', email);
            console.log('receivePromo', receivePromo);

            await sleep(2000);

            // call a mailing service, or store to a database

            return { success: true };
        },
    }),
    like: defineAction({
        input: z.object({ postId: z.string() }),
        handler: async ({ postId }) => {
            await sleep(1000);

            if (Math.random() < 0.1) {
                throw new AstroError('Fail');
            }

            // update likes in db
            likes[postId] += 1;
            console.log(`${postId}: `, likes[postId]);
            return likes[postId];
        },
    }),
};
