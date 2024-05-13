export let likes: Record<string, number> = {};

export const users = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
];

for (const user of users) {
    likes[user] = 0;
}
