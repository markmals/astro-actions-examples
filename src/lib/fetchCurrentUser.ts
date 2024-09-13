import type { AstroCookies } from 'astro';
import { User, db, eq } from 'astro:db';

export async function fetchCurrentUser({ cookies }: { cookies: AstroCookies }) {
    const user = await db.select().from(User).where(eq(User.id, 1)).get();
    return user!;
}
