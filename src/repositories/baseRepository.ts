type SoftDeletableDelegate = {
    count: (args: any) => Promise<number>;
    update: (args: any) => Promise<any>;
};

export class BaseRepository<TDelegate extends SoftDeletableDelegate> {
    protected delegate: TDelegate;

    constructor(delegate: TDelegate) {
        this.delegate = delegate;
    }

    protected baseWhere(userId: string, extra?: Record<string, unknown>) {
        return {
            userId,
            deletedAt: null,
            ...extra,
        };
    }

    async count(userId: string, extra?: Record<string, unknown>) {
        return this.delegate.count({
            where: this.baseWhere(userId, extra),
        });
    }

    async softDelete(userId: string, id: string) {
        return this.delegate.update({
            where: {
                id_userId: { id, userId },
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}
