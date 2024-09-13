class DateFormatter {
    private readonly formatter: Intl.DateTimeFormat;

    public constructor(options: Intl.DateTimeFormatOptions) {
        this.formatter = new Intl.DateTimeFormat("en", options);
    }

    protected getDate(date: string | Date): Date {
        return date instanceof Date ? date : new Date(date);
    }

    public format(date: string | Date): string {
        return this.formatter.format(this.getDate(date));
    }
}

const timeStyle = "short";

class FrontPageFormatter extends DateFormatter {
    public constructor() {
        super({ dateStyle: "long", timeStyle });
    }

    public override format(date: string | Date): string {
        return super.format(date).replace("at", "•");
    }
}

class CommentFormatter extends DateFormatter {
    public constructor() {
        super({ dateStyle: "short", timeStyle });
    }

    public formatAsISO(date: string | Date): string {
        return this.getDate(date).toISOString();
    }

    public formatForDisplay(date: string | Date): string {
        return this.format(date);
    }
}

export const formatters = {
    frontPage: new FrontPageFormatter(),
    comment: new CommentFormatter(),
};
