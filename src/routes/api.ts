import {Router} from 'express';
import {moexService} from '../services/moex';
import moment from 'moment';
import {IStatResponse} from '../types/api';

export const apiRouter = Router();

apiRouter.get('/stat', async (req, res) => {
    const {duration, ticker, sum} = req.query;
    const from = moment().subtract(duration, 'years').format('YYYY-MM-DD');
    const till = moment().format('YYYY-MM-DD');
    const allHistory = await moexService.getHistory(ticker, {from, till});
    //const history = pick(allHistory, from);
    const response: IStatResponse = {
        allHistory,
        history: []
    };
    res.json(response);
});

/* 
apiRouter.get('/', async (req, res) => {
    const ticker = 'ROSN';
    const {from, till} = await getTimeBorders(ticker);
    const fromYear = new Date(from).getFullYear();
    const tillYear = new Date(till).getFullYear();
    const years = [];
    for (let index = 1; index <= tillYear - fromYear; index++) {
        years.push(index);
    }
    const sum = 10000;
    res.render('./index', {
        sum,
        years,
        ticker
    });
}); */