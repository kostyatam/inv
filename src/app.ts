import mysql from 'mysql';
import {moexService} from './services/moex';
import {IBorders, IHistory, IShare} from './types/moex';
import moment from 'moment';


export enum EPeriod {
    MONTHLY = 'MONTHLY',
}

class App {
    connection: mysql.Connection;
    init() {
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'user',
            password: 'password',
            database: 'stockDB',
            multipleStatements: true
        });
        const sql = `
        DROP TABLE IF EXISTS borders;
        DROP TABLE IF EXISTS history;
        DROP TABLE IF EXISTS shares;
        CREATE TABLE shares (ticker VARCHAR(8) NOT NULL, name TINYTEXT, PRIMARY KEY (ticker));
        CREATE TABLE borders (ticker VARCHAR(8) NOT NULL, \`from\` DATE, till DATE, FOREIGN KEY (ticker) REFERENCES shares(ticker));
        CREATE TABLE history (ticker VARCHAR(8) NOT NULL, date DATE, open DOUBLE, close DOUBLE, low DOUBLE, high DOUBLE, FOREIGN KEY (ticker) REFERENCES shares(ticker));
        `;
        const shares = [{
            ticker: 'SBER',
            name: 'Сбербанк'
        }, {
            ticker: 'MOEX',
            name: 'Московская Биржа'
        }, {
            ticker: 'GAZP',
            name: 'Газпром'
        }];
        return new Promise<void>((resolve, reject) => {
            this.connection.query(sql, err => {
                if (err ) reject(err);
                console.log("Tables created");

                this.getShares().then((shares) => {
                    const queries = shares.map(({ticker}) => this.getBorders(ticker).then(borders => this.getHistory(ticker, borders)));
                    return Promise.all(queries).then(() => resolve(), reject)
                });
            })
        });
    }

    getShares () {
        return new Promise<IShare[]>((resolve, reject) => {
            const sql = 'SELECT * FROM shares;';
            this.connection.query(sql, (err, result) => {
                if (err) reject(err);
                if (!result || !result.length) {
                    const shares = [{
                        ticker: 'SBER',
                        name: 'Сбербанк'
                    }, {
                        ticker: 'MOEX',
                        name: 'Московская Биржа'
                    }, {
                        ticker: 'GAZP',
                        name: 'Газпром'
                    }, {
                        ticker: 'YNDX',
                        name: 'Яндекс'
                    }];
                    const sql = 'INSERT INTO shares VALUES ?;';
                    return this.connection.query(sql, [shares.map(({ticker, name}) => [ticker, name])], (err) => {
                        if (err) reject(err);
                        resolve(shares);
                    });
                }
                resolve(result);
            })
        })
    }

    getBorders (ticker: string) {
        return new Promise<IBorders>((resolve, reject) => {
            const sql = `SELECT \`from\`, till FROM borders WHERE ticker='${ticker}'`;
            this.connection.query(sql, (err, result) => {
                if (err) reject(err);
                if (!result || !result.length) return moexService.getTimeBorders(ticker).then(borders => {
                    const sql = 'INSERT INTO borders SET ?;';
                    this.connection.query(sql, {ticker, ...borders});
                    resolve(borders);
                });
                resolve(result[0]);
            })
        })
    }
    
    getHistory (ticker: string, {from, till}: IBorders) {
        const insertHistory = (history: IHistory[]) => new Promise<IHistory[]>((resolve, reject) => {
            const preparedHistory = history.map(({date, open, close, low, high}) => [ticker, date, open, close, low, high])
            const sql = 'INSERT INTO history(ticker,date,open,close,low,high) VALUES ?;';
            this.connection.query(sql, [preparedHistory], (err) => {
                if (err) reject(err);
                resolve(history)
            });
        });
        return new Promise<IHistory[]>((resolve, reject) => {
            const sql = `SELECT * FROM history WHERE ticker='${ticker}' AND date>='${from}' AND date<='${till}' ORDER BY date`;
            this.connection.query(sql, (err, result) => {
                if (err) return reject(err);
                if (!result || !result.length) return moexService.getHistory(ticker, {from, till}).then(insertHistory).then(resolve, reject);
                const requests: Promise<IHistory[]>[] = [];
                const dbFrom = result[0];
                const dbTill = result[result.length - 1];
                
                if (moment(from).isBefore(result[0].date)) {
                    const request = moexService
                        .getHistory(ticker, {from, till: moment(dbFrom).subtract(1, 'day').format('YYYY-MM-DD')})
                        .then(insertHistory);
                    requests.push(request);
                }

                requests.push(Promise.resolve(result));

                if (moment(till).isAfter(dbTill)) {
                    const request = moexService
                        .getHistory(ticker, {from: moment(dbTill).add(1, 'day').format('YYYY-MM-DD'), till})
                        .then(insertHistory);
                    requests.push(request);
                }

                Promise.all(requests).then(responses => responses.reduce((prev, cur) => prev.concat(cur), [])).then(resolve, reject);
            })
        })
    }

    pick (history: IHistory[], from: string, period: EPeriod = EPeriod.MONTHLY): IHistory[] {
        if (period === EPeriod.MONTHLY) {
          const res: IHistory[] = [];
          const pickDate = moment(from).set({

          });
          history.reduce((prev: IHistory, next: IHistory) => {
            const currentDate = moment(next.date);
            const prevDate = prev && moment(prev.date);
            if (currentDate.isBefore(pickDate)) {
                return next;
            }
            const isCurrentDateOnSameMonth = pickDate.month() === currentDate.month() || pickDate.year() === currentDate.year();
            const isPrevDateOnSameMonth = prevDate && (pickDate.month() === prevDate.month() || pickDate.year() === prevDate.year());
            if (!isCurrentDateOnSameMonth) {
                if (isPrevDateOnSameMonth) {
                    res.push(prev);
                }
      
                pickDate.set({
                    year: currentDate.year(),
                    month: currentDate.month()
                });
      
              return next;
            }
      
            if (pickDate.isSameOrBefore(currentDate)) {
                if (isPrevDateOnSameMonth) {
                    const diffWithCurrentDate = Math.abs(pickDate.diff(currentDate));
                    const diffWithPrevDate = Math.abs(pickDate.diff(prevDate));
        
                    if (diffWithPrevDate < diffWithCurrentDate) {
                        res.push(prev);
                        pickDate.add(1, 'month');
                        return next;
                    }
                }
              
                res.push(next);
                pickDate.add(1, 'month');
                return null;
            }
      
            return next;
          });

          return res;
        }
    }

    buy (picked: IHistory[], sum: number) {
        const bought = {
            contributionAmount: 0,
            sharesCount: 0,
            moneyBalance: 0,
            currentPrice: 0,
            allBet: picked.length * sum / picked[0].low * picked[picked.length - 1].low
        };

        picked.map((item) => {
            const cash = sum + bought.moneyBalance;
            const sharesBought = Math.floor(cash/item.high);
            bought.contributionAmount+= sum,
            bought.sharesCount+= sharesBought,
            bought.moneyBalance = cash - (item.high * sharesBought);
        }, bought);

        bought.currentPrice = picked[picked.length - 1].low * bought.sharesCount;

        return bought;
    }
}

export const app = new App();