
export interface IBorders {
    from: string;
    till?: string;
}


export interface IHistory {
    open: number;
    close: number;
    low: number;
    high: number;
    date: string;
    usd: number;
}
  
export interface IPagination {
    start: number;
    total: number;
    limit?: number;
}

export interface IHistoryPage {
    history: IHistory[],
    pagination: IPagination;
}

export interface IRates {
    [date: string]: {
        RUB: number
    }
}

export interface IShare {
    ticker: string;
    name: string;
}