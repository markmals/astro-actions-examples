import type { APIContext } from 'astro';
import { posts } from '../data/posts';

export async function GET({ params, request }: APIContext) {
    return new Response(JSON.stringify(posts));
}
