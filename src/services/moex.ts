import * as request from 'request';
import {IBorders, IHistory, IHistoryPage, IRates} from '../types/moex';
import moment from 'moment';

const ISS_URL = 'https://iss.moex.com/iss';
const FIXER_API_KEY = 'f974e9e64c8ca5982df8ab2e362944e4';

enum EBoards {
  EQBR = 'EQBR', //Основной режим: А1-Акции и паи - безадрес. 0
  TQBR = 'TQBR', //Т+: Акции и ДР - безадрес. 1
  EQNE = 'EQNE', //Основной режим: Акции и паи внесписочные - безадрес.
}

class MOEXService {
  getTimeBorders (ticker: string): Promise<IBorders> {
    return new Promise((resolve, reject) => request
      .get({
        url: `${ISS_URL}/history/engines/stock/markets/shares/securities/${ticker}/dates.json`,
        rejectUnauthorized: false
      },(err, response, body) => {
        if (err || response.statusCode !== 200) {
          return reject(err);
        }
        const {data} = JSON.parse(body).dates;
        const [from, till] = data[0];
  
        resolve({
          from,
          till
        })
      }))
  }

  getHistory = async (ticker: string, borders: IBorders): Promise<IHistory[]> => {
    const {history, pagination: {total, limit}} = await this.getHistoryPage(ticker, borders, 0);
    const count = Math.ceil((total - limit)/limit);
    const requests: Promise<IHistory[]>[] = [Promise.resolve(history)];
    for (let i = 1; i <= count; i++) {
      requests.push(this.getHistoryPage(ticker, borders, i * limit).then(({history}) => history));
    }
    return Promise.all(requests).then(data => data.reduce((acc, next) => acc.concat(next), []));
  }

  private getHistoryPage = (ticker: string, borders: IBorders, start = 0): Promise<IHistoryPage> => {
    const {from, till} = borders;
  
    return new Promise((resolve, reject) => request
      .get({
        url: `${ISS_URL}/history/engines/stock/markets/shares/securities/${ticker}.json?start=${start}&from=${from}&till=${till}`,
        rejectUnauthorized: false
      }, (err, response, body) => {
        if (err || response.statusCode !== 200) {
          return reject(err);
        }
        const res = JSON.parse(body);
        const {data} = res.history;
        const [_, total, limit] = res['history.cursor'].data[0];
        const history: IHistory[] = [];
        for (let i = 0; i < data.length; i++) {
          const share = data[i];
          const [board, date] = share;
          if (!EBoards[board]) continue;
          if (history[i - 1] && date === history[i - 1].date) continue;
          history.push({
            open: share[6],
            close: share[11],
            low: share[7],
            high: share[8],
            usd: null, //getCurrencyRateByDate(date, rates),
            date
          });
        };
        resolve({
          history,
          pagination: {
            start,
            total,
            limit
          }
        });
    }))
  }
}

export const moexService  = new MOEXService;

// async function main () {
//   const borders = await getTimeBorders('MOEX');
//   const history = await getHistory('MOEX', borders);
//   const sum = 10000;
//   let balance = 0;
//   let shares = 0;
//   interface ITableLog {
//     price: number,
//     bought: number,
//     shares: number,
//     balance: number,
//     value: number,
//     date: string,
//     usd: number,
//   }
//   const table: ITableLog[] = [];
//   const picked = pick(history, borders.from, EPeriod.MONTHLY);
//   picked.map(item => {
//     const bought = Math.floor((sum + balance) / item.high)
//     shares+= bought;
//     balance = (sum + balance) % item.high;
//     table.push({
//       date: item.date,
//       price: item.high,
//       bought,
//       shares,
//       balance: parseFloat(balance.toFixed(2)),
//       value: Math.floor(shares * item.high),
//       usd: item.usd
//     })
//   });
//   console.table(table);
// }

// //main();


// function getCurrencyRates ({from, till}: IBorders): Promise<IRates> {
//   return new Promise((resolve, reject) => request
//     .get({
//       url: `${CURRENCY_URL}/history?start_at=${from}&end_at=${till}&symbols=RUB&base=USD`,
//       rejectUnauthorized: false
//     },(err, response, body) => {
//       if (err || response.statusCode !== 200) {
//         return reject(err);
//       };
//       const {rates} = JSON.parse(body);
//       resolve(rates)
//     }));
// }

// function getCurrencyRateByDate (date: string, rates: IRates): number {
//   if (rates[date] && rates[date].RUB) {
//     return rates[date].RUB;
//   }
//   for(let i = 1; i < 30; i++) {
//     const after = moment(date).add(i, 'day').format('YYYY-MM-DD');
//     if (!moment(date).diff(moment(after), 'month', false) && rates[after] && rates[after].RUB) {
//       return rates[after].RUB;
//     }
//     const before = moment(date).subtract(i, 'day').format('YYYY-MM-DD');
//     if (!moment(date).diff(moment(before), 'month', false) && rates[before] && rates[before].RUB) {
//       return rates[before].RUB;
//     }
//   }
// }