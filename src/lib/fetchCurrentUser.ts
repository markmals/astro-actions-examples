import type { ActionAPIContext } from "astro/actions/runtime/store.js";
import { User, db, eq } from "astro:db";

export async function fetchCurrentUser(context: ActionAPIContext) {
    // TODO:
    const { cookies } = context;

    const user = await db.select().from(User).where(eq(User.id, 1)).get();
    return user!;
}
