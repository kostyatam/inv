import * as request from 'request';
import {IBorders, IRates} from '../types/moex';
const CURRENCY_URL = 'https://api.exchangeratesapi.io'

class CurrencyService {
    getCurrencyRates ({from, till}: IBorders): Promise<IRates> {
        return new Promise((resolve, reject) => request
          .get({
            url: `${CURRENCY_URL}/history?start_at=${from}&end_at=${till}&symbols=RUB&base=USD`,
            rejectUnauthorized: false
          },(err, response, body) => {
            if (err || response.statusCode !== 200) {
              return reject(err);
            };
            const {rates} = JSON.parse(body);
            resolve(rates)
          }));
    }
}

export const currencyService = new CurrencyService;

// function getCurrencyRateByDate (date: string, rates: IRates): number {
//     if (rates[date] && rates[date].RUB) {
//       return rates[date].RUB;
//     }
//     for(let i = 1; i < 30; i++) {
//       const after = moment(date).add(i, 'day').format('YYYY-MM-DD');
//       if (!moment(date).diff(moment(after), 'month', false) && rates[after] && rates[after].RUB) {
//         return rates[after].RUB;
//       }
//       const before = moment(date).subtract(i, 'day').format('YYYY-MM-DD');
//       if (!moment(date).diff(moment(before), 'month', false) && rates[before] && rates[before].RUB) {
//         return rates[before].RUB;
//       }
//     }
//  }