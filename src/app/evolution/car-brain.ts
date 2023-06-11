import {Controls} from './controls';
import {SensorsFront} from './sensors-front';
import {SensorsSides} from './sensors-sides';
import {NeuralNetwork} from './neural-network';
import {Car} from './car';
import {Road} from './road';

export class CarBrain {
  controls!: Controls;
  sensorsFront!: SensorsFront;
  sensorsSides!: SensorsSides;
  brain!: NeuralNetwork;
  outputs!: any;
  constructor(public car: Car, public road: Road) {
    this.controls = new Controls();
    this.sensorsFront = new SensorsFront(this.car);
    this.sensorsSides = new SensorsSides(this.car);
    this.brain = new NeuralNetwork([9, 5, 5, 2]);
  }

  update(time:number): void {
    this.sensorsFront.update([
      ...this.road.bordersDico,
      ...this.road.trafficDico,
    ], time);

    this.sensorsSides.update([
      ...this.road.bordersDico,
      ...this.road.lanesDico
    ], time);

    const rotationOffset = {offset: 1 - Math.abs(this.car.rotation.y)};

    const left = this.sensorsSides.readings[1]?.distance ?? 0;
    const right = this.sensorsSides.readings[2]?.distance ?? 0;
    const centerLaneOffset = {offset: 1 - this.calculate(left, right)};


    const sensorsReadings = [
      this.sensorsSides.readings[0],
      ...this.sensorsFront.readings,
      this.sensorsSides.readings[3],
      rotationOffset,
      centerLaneOffset
    ];


    const offsets = sensorsReadings.map(s => {
        return s == null ? 0 : s.offset
      }
    );

    this.outputs = NeuralNetwork.feedForward(offsets, this.brain);
  }

  calculate(left: number, right:number) {
    const max = Math.max(left, right);
    const min = Math.min(left, right);
    const difference = max - min;
    return difference / (max + min);
  }
}
