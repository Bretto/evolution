import {Box3, MathUtils, Mesh, Object3D, Raycaster, Vector3} from 'three';
import {Car} from './car';
import * as THREE from 'three';
import {lerp} from 'three/src/math/MathUtils';

export class SensorsFront extends Object3D {
  car: Car;
  rayCount: number;
  rayLength: number;
  rayLimit: number;
  raySpread: number;
  rays: Array<[Vector3, Vector3]>;
  readings: Array<{ point: Vector3; distance: number, face: any, offset: number } | null>;
  raycaster: Raycaster;

  dico!: Array<{ name: string, mesh: Mesh, box: Box3 }>;

  collision: boolean = false;

  lines: any = [];


  constructor(car: Car) {
    super();
    this.car = car;
    this.rayCount = 5;
    this.rayLength = 15;
    this.rayLimit = 5;
    this.raySpread = Math.PI / 10;
    this.rays = [];

    this.readings = [];
    this.raycaster = new Raycaster();
    this.addLimit();

    this.castRays(0);
    this.draw();
    this.car.add(this);

    this.dico = [
      this.car.dico,
      ...this.car.road.bordersDico,
      ...this.car.road.trafficDico,
    ];
  }

  update(objects: any, time: number) {
    this.visible = this.car.smart;
    if (!this.car.isOn) return;
    this.castRays(time);
    this.checkIntersections(objects.map((e: any) => e.mesh));
    this.checkCollision(this.dico);
    this.updateLines();
  }

  private castRays(time: number) {
    this.rays = [];
    // const t = Math.cos(time * 10) * 0.1;
    const t = 0;

    for (let i = 0; i < this.rayCount; i++) {
      let rayAngle;
      let raySpread = this.raySpread;
      if (i === 0 || i == this.rayCount - 1) raySpread *= 3;

      rayAngle =
        lerp(
          raySpread / 2,
          -raySpread / 2,
          this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)
        ) + this.car.angle + t;


      const y = 0.3;

      const start = new THREE.Vector3(this.car.position.x, y, this.car.position.z);
      const end = new THREE.Vector3(
        this.car.position.x - Math.sin(rayAngle) * this.rayLength,
        y,
        this.car.position.z - Math.cos(rayAngle) * this.rayLength
      );
      this.rays.push([start, end]);
    }
  }

  private checkIntersections(objects: any) {
    this.readings = [];

    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      this.raycaster.set(ray[0], ray[1].clone().sub(ray[0]).normalize());

      const intersections = this.raycaster.intersectObjects(objects);

      if (intersections.length > 0) {
        const {point, distance, face} = intersections[0];
        const offset = this.calculateReach(distance);
        this.readings.push({point, distance, face, offset});
      } else {
        this.readings.push(null);
      }
    }

    if (this.visible) {
      const intersectionGroup = this.car.road.intersectionGroup;
      while (intersectionGroup.children.length > 0) {
        const child = intersectionGroup.children[0];
        intersectionGroup.remove(child);
      }
    }

    this.readings.forEach((intersection: any) => {
      if (!intersection) return;
      const {face, point} = intersection;
      const direction = face.normal.clone();
      const origin = point.clone();

      const arrowHelper = new THREE.ArrowHelper(
        direction,
        origin,
        1,
        0xff0000
      );

      if (this.visible) {
        this.car.road.intersectionGroup.add(arrowHelper);
      }
    });
  }

  calculateReach(distance: number): number {
    return Math.max(0, Math.min((distance - this.rayLength) / (this.rayLimit - this.rayLength), 1));
  }

  private checkCollision(objects: any) {
    const car = objects.filter((e: any) => e.name === 'car')[0];
    const carBox = car.box.setFromObject(car.mesh);
    let name = '';
    this.collision = objects
      .filter((e: any) => e.name !== 'car')
      .some((o: any) => {
        const box = o.box.setFromObject(o.mesh);
        name = o.name;
        return carBox.intersectsBox(box);
      });
    if (this.collision) {
      // console.log(name);
      car.mesh.material.color.set(0xff0000);
      this.car.isOn = false;
    } else {
      // console.log('no collision');
      car.mesh.material.color.set(0xffaa00);
    }
  }

  draw() {
    const material = new THREE.LineBasicMaterial({color: 0xffff00});

    for (let i = 0; i < this.rayCount; i++) {
      let end: any = this.rays[i][1];

      const points = [
        new THREE.Vector3(this.rays[i][0].x, this.rays[i][0].y, this.rays[i][0].z),
        new THREE.Vector3(end.x, end.y, end.z),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.position.y = -.3; // this is to correct the car offset from the road
      this.add(line);
      this.lines.push(line);
    }
  }

  updateLines() {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const start = this.rays[i][0].clone().sub(this.getWorldPosition(new THREE.Vector3()));
      const end = this.rays[i][1].clone().sub(this.getWorldPosition(new THREE.Vector3()));

      // Update the line's vertices
      line.geometry.attributes.position.setXYZ(0, start.x, .3, start.z);
      line.geometry.attributes.position.setXYZ(1, end.x, .3, end.z);
      line.geometry.attributes.position.needsUpdate = true;
      line.rotation.y = -this.car.angle;
    }
  }

  addLimit() {
    const segmentCount = 32,
      radius = this.rayLimit,
      points = [],
      material = new THREE.LineBasicMaterial({color: 0xFF0000});

    for (var i = 0; i <= segmentCount; i++) {
      var theta = (i / segmentCount) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          Math.sin(theta) * radius,
          0
        )
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const circleOutline = new THREE.Line(geometry, material);
    circleOutline.rotation.x = Math.PI / 2;
    this.add(circleOutline);
  }

}
