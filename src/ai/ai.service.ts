require('@tensorflow/tfjs');
import * as tf from '@tensorflow/tfjs-node';
import * as use from "@tensorflow-models/universal-sentence-encoder"
import * as path from 'path'
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map } from 'rxjs/operators';
import * as jsonClarisa from './clarisa.json';
@Injectable()
export class AI {
    private readonly logger = new Logger(AI.name);
    model
    clarisa
    naturalmodel
    traningModel: tf.Sequential
    constructor(private httpService: HttpService) {

        this.init()
    }
    async init() {

        this.logger.log("Start Loading Trained Model")
        this.model = await tf.loadLayersModel('file://' + path.resolve(__dirname, 'wos_trained_model/model.json'));
        this.naturalmodel = await use.load()
        this.clarisa = process.env.PRODUCTION ? await this.httpService.get('https://clarisa.cgiar.org/api/institutions', { auth: { username: 'gldc.data', password: '7823282' } }).pipe(map((d: any) => d.data)).toPromise() : jsonClarisa;
        this.logger.log("Trained Model Loaded")
    }
    calculatePercent(percent) {
        return Math.round(percent * 100);
    }
    async makePrediction(value) {
        const todoEmbedding = await this.naturalmodel.embed(value.toLowerCase())
        let results: any = this.model.predict(todoEmbedding)
        let clarisa_index = this.clarisa[results.argMax(1).dataSync()[0]];
        return { value: clarisa_index ? clarisa_index : null, confidant: Math.max(...results.dataSync().map(d => d)) }
    }

}