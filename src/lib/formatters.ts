function makeDateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat("en", options);
}

const timeStyle = "short";

export const formatters = {
    frontPage: {
        dateFormatter: makeDateFormatter({ dateStyle: "long", timeStyle }),
        formatDate(date: Date): string {
            return this.dateFormatter.format(date).replace("at", "•");
        },
    },
    comment: {
        dateFormatter: makeDateFormatter({ dateStyle: "short", timeStyle }),
        formatDate(date: Date): string {
            return this.dateFormatter.format(date);
        },
    },
};
