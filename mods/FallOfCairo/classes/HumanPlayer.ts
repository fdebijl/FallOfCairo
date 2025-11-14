import { Actor } from './Actor';

export class HumanPlayer extends Actor {
  isAlive: boolean = true;
  kills: number = 0;
  deaths: number = 0;
  score: number = 0;
}
