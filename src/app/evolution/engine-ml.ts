import {Road} from './road';
import {Car} from './car';
import {NeuralNetwork} from './neural-network';
import {Visualizer} from './visualizer';
import {SceneComponent} from './scene.component';

export class EngineMl {


  carNum: number = 100;
  cars: Car[] = [];
  car: Car | undefined;
  lastCar: Car | undefined;
  road!: Road;
  lastY: number = 0;
  lastDistance: number = 150;
  isRunning: boolean = false;
  isAutoPilot: boolean = true;
  brains: NeuralNetwork[] = [];
  brainVersion: number = 0;
  carsRunning = 0;

  constructor(public scene: SceneComponent, public networkCtx: any) {
    console.log('ENGINE ML');
  }


  startRace(): void {
    const bestBrainStr = localStorage.getItem("bestBrain");

    if (bestBrainStr) {
      const bestBrain = JSON.parse(bestBrainStr);
      // console.log('BEST BRAIN', brain.version);
      this.brainVersion = bestBrain.version;
      this.lastDistance = bestBrain.distance;
      if (this.brains.length == 0) {
        this.brains.push(bestBrain);
      } else if (bestBrain.version > this.brains[this.brains.length - 1]?.version) {
        this.brains.push(bestBrain);
      }
    }

    // console.log('ON LOAD', brain.version);
    this.cars = [];
    for (let i = 0; i < this.carNum; i++) {
      this.cars.push(this.addCar());
      if (bestBrainStr) {
        const bestBrain = JSON.parse(bestBrainStr);
        this.setupBrain(i, bestBrain);
      } else {
        // console.log('GOOD BRAIN');
        // const brain = JSON.parse(this.goodBrain);
        // this.setupBrain(i, brain);
      }

    }
    this.car = this.cars[0];

  }

  setupBrain(i: number, brain: any): void {
    this.cars[i].carBrain.brain = brain;
    this.cars[i].uid = i;
    if (i != 0 && brain) {
      // / this.brainVersion
      NeuralNetwork.mutate(this.cars[i].carBrain.brain, 0.1);
    }
  }

  addCar(): Car {
    const car = new Car(0, 0, this.road);
    car.position.z = 6;
    car.position.y = .3;
    this.scene.scene.add(car);
    return car;
  }

  addRoad(): Road {
    const road = new Road(this.scene.width, this.scene.height);
    this.scene.scene.add(road);
    return road;
  }

  init(): void {
    this.road = this.addRoad();
    this.startRace();
  }

  onSave(): void {
    const car = this.lastCar || this.car!;

    if (this.lastY >= this.lastDistance) {
      this.lastDistance = this.lastY;
      const brain = structuredClone(car.carBrain.brain);
      brain.version += 1;
      brain.distance = this.lastY;
      localStorage.setItem("bestBrain", JSON.stringify(brain));
    }

    this.restartTraining();
  }

  onDelete(): void {
    localStorage.removeItem("bestBrain");
    this.brains.length = 0;
    this.brainVersion = 0;
    this.lastDistance = 150;
    this.restartTraining();
  }

  restartTraining(): void {

    this.cars.forEach(c => {
      c.isOn = false;
      c.smart = false;
      c.update(0);
    });

    this.lastCar = undefined;
    this.road.reset();
    this.startRace();
  }


  update(time: number) {

    if (this.car) {
      this.road.car = this.car;
      this.lastY = Math.abs(Math.floor(this.car.y));

      this.road.update();

      for (const car of this.cars) {
        car.update(time);
      }

      const carsIsOn = this.cars.filter(c => c.isOn);
      const minCarYValue = Math.min(...carsIsOn.map(c => c.y));
      this.carsRunning = carsIsOn.length;

      for (const car of carsIsOn) {
        car.smart = false;
      }

      this.car = carsIsOn.find(c => c.y === minCarYValue);

      if (this.car) {
        this.car.smart = true;
        Visualizer.drawNetwork(
          this.networkCtx,
          this.car.carBrain.brain
        );
        this.lastCar = this.car;
      } else {
        this.onSave();
      }
    }
  }

  onAutoPilot() {
    // if(!this.car) return
    console.log('AUTO PILOT', this.isAutoPilot);
    this.cars.forEach(c => c.autonomous = this.isAutoPilot);
  }
}
