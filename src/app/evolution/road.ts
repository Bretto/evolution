import * as THREE from 'three';
import {Box3, Mesh, Object3D} from 'three';
import {lerp} from 'three/src/math/MathUtils';
import {Car} from './car';
import * as _ from 'lodash';

export class Road extends Object3D {
  x: number;
  width: number;
  height: number;
  laneCount: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  borders: { x: number; y: number }[][];

  bordersDico!: Array<{ name: string, mesh: Mesh, box: Box3 }>;
  lanesDico!: Array<{ name: string, mesh: Mesh, box: Box3 }>;

  trafficDico: Array<{ name: string, mesh: Mesh, box: Box3 }> = [];

  floor!: THREE.Mesh;
  floorWidth: number = 10;
  floorHeight: number = 20;

  texture: any;

  intersectionGroup = new THREE.Group();

  intersectionGroupSides = new THREE.Group();

  car: Car | undefined;

  constructor(width: number, height: number, laneCount = 5) {
    super();
    this.width = width;
    this.x = this.width / 2;
    this.height = height;
    this.laneCount = laneCount;

    this.left = this.x - this.width / 2;
    this.right = this.x + this.width / 2;

    this.top = 0;
    this.bottom = height;

    const topLeft = {x: this.left, y: this.top};
    const topRight = {x: this.right, y: this.top};
    const bottomLeft = {x: this.left, y: this.bottom};
    const bottomRight = {x: this.right, y: this.bottom};
    this.borders = [
      [topLeft, bottomLeft],
      [topRight, bottomRight],
    ];

    this.floor = this.createFloor(this.floorWidth, this.floorHeight, 0xdddddd);
    const {leftBorder, rightBorder} = this.addBorders();
    const leftBox = new THREE.Box3().setFromObject(leftBorder);
    const rightBox = new THREE.Box3().setFromObject(rightBorder);
    const left = {name: 'leftBorder', mesh: leftBorder, box: leftBox};
    const right = {name: 'rightBorder', mesh: rightBorder, box: rightBox};


    this.bordersDico = [left, right];
    this.lanesDico = this.addLaneBorders().map((laneBorder, index) => {
      this.add(laneBorder);
      const box = new THREE.Box3().setFromObject(laneBorder);
      return {
        name: `lane${index + 1}Border`,
        mesh: laneBorder,
        box: box,
      };
    });


    this.add(this.floor, leftBorder, rightBorder, this.intersectionGroup, this.intersectionGroupSides);
    this.addTraffic();
  }

  getLaneCenter(laneIndex: number): number {
    const laneWidth = this.floorWidth / this.laneCount;
    const lanePosition = lerp(-this.floorWidth / 2 + laneWidth / 2,
      this.floorWidth / 2 - laneWidth / 2, (laneIndex - 1) / (this.laneCount - 1));
    return lanePosition;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";

    for (let i = 1; i <= this.laneCount - 1; i++) {
      const x = lerp(this.left, this.right, i / this.laneCount);
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(x, this.top);
      ctx.lineTo(x, this.bottom);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = "red";
    this.borders.forEach((border) => {
      ctx.beginPath();
      ctx.moveTo(border[0].x, border[0].y);
      ctx.lineTo(border[1].x, border[1].y);
      ctx.stroke();
    });
  }

  generateRoadTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    const ctx: any = canvas.getContext('2d');
    canvas.id = 'myTextureCanvas';

    canvas.width = this.width;
    canvas.height = this.height;

    ctx.fillStyle = 'grey'; // Set the color of the road
    ctx.fillRect(0, 0, this.width, this.bottom - this.top); // Draw the road

    this.draw(ctx);

    const texture = new THREE.Texture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    const container = document.createElement('div');
    container.appendChild(canvas);

    // Append the container element to the DOM
    document.body.appendChild(container);
    this.texture = texture;
    return texture;
  }


  createFloor(width: number, height: number, color: number): any {
    const geometry: any = new THREE.PlaneGeometry(width, height, 100, 100);
    const material: any = new THREE.MeshPhongMaterial({
      map: this.generateRoadTexture(),
      color: 'grey'
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    return floor;
  }

  addBorders() {
    const leftBorder = this.createBorders(.1, .5, this.floorHeight, 0xdddddd);
    leftBorder.position.x = -this.floorWidth / 2 - .05;
    leftBorder.position.y = .25;

    const rightBorder = this.createBorders(.1, .5, this.floorHeight, 0xdddddd);
    rightBorder.position.x = this.floorWidth / 2 + .05;
    rightBorder.position.y = .25;

    return {leftBorder, rightBorder};
  }

  addLaneBorders() {
    const laneBorders = [];
    const laneWidth = this.floorWidth / this.laneCount;
    for (let i = 1; i < this.laneCount; i++) {
      const laneBorder = this.createLaneBorder(.1, 0.5, this.floorHeight, 0xdddddd);
      laneBorder.position.x = (-this.floorWidth / 2) + laneWidth * i;
      laneBorder.position.y = 0.25;
      // this.add(laneBorder);
      laneBorders.push(laneBorder);
    }

    return laneBorders;
  }


  createBorders(width: number, height: number, depth: number, color: number, alpha: number = 1): any {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: alpha
    });
    const box = new THREE.Mesh(geometry, material);
    return box;
  }

  createLaneBorder(width: number, height: number, depth: number, color: number): any {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: .1,
      depthWrite: false,
      depthTest: true,
    });
    const box = new THREE.Mesh(geometry, material);
    return box;
  }

  addTraffic() {
    const numCars = 3;
    for (let i = 0; i < numCars; i++) {
      const car = new Car(0, 0, this, false);
      const carMesh = car.dico.mesh;
      carMesh.position.z = _.random(-5, -10);
      // carMesh.position.x = this.getLaneCenter(Math.floor(Math.random() * 5) + 1);
      // carMesh.position.z = -15
      carMesh.position.x = this.getLaneCenter(3);
      carMesh.position.y = .3;
      this.add(car);
      this.trafficDico.push(car.dico);
    }
  }

  reset() {
    this.trafficDico.forEach(car => {
      car.mesh.position.z = _.random(-5, -10);
      // car.mesh.position.x = this.getLaneCenter(Math.floor(Math.random() * 5) + 1);
      car.mesh.position.x = this.getLaneCenter(3);
    });
  }

  update() {
    if (this.car) {
      this.texture.offset.y += this.car.speed * .01;

      this.trafficDico.forEach(car => {
        // @ts-ignore
        car.mesh.position.z -= -this.car.speed * .2;
        if (car.mesh.position.z > 10) {
          car.mesh.position.z = _.random(-10, -15);
          car.mesh.position.x = this.getLaneCenter(_.random(1, 5));
        }
      });
    }
  }


}
