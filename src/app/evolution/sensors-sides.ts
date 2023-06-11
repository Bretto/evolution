import {Box3, MathUtils, Mesh, Object3D, Raycaster, Vector3} from 'three';
import {Car} from './car';
import * as THREE from 'three';
import {lerp} from 'three/src/math/MathUtils';
import {forEach} from 'lodash';

export class SensorsSides extends Object3D {
  car: Car;
  rayCount: number;
  rayLength: number;
  rayLimit: number;
  raySpread: number;
  rays: Array<[Vector3, Vector3]>;
  readings: Array<{ point: Vector3; distance: number, face: any, offset: number } | null>;
  computedReadings!: Array<{ point: Vector3; distance: number, face: any, offset: number } | null>;
  raycaster: Raycaster;

  dico!: Array<{ name: string, mesh: Mesh, box: Box3 }>;

  collision: boolean = false;

  lines: any = [];


  constructor(car: Car) {
    super();
    this.car = car;
    this.rayCount = 2;
    this.rayLength = 15;
    this.rayLimit = .7;
    this.raySpread = Math.PI / 4;
    this.rays = [];

    this.addLimit();

    this.readings = [];
    this.raycaster = new Raycaster();

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
    // this.checkCollision(this.dico);
    this.updateLines();
  }

  private castRays(time: number) {
    this.rays = [];
    // const t = Math.cos(time * 10) * 0.1;
    const t = 0;

    for (let i = 0; i < this.rayCount; i++) {
      let rayAngle: any;

      if (i === 0) {
        rayAngle = this.car.angle + t + Math.PI / 2; // Right ray at 90-degree angle
      } else if (i === this.rayCount - 1) {
        rayAngle = this.car.angle + t - Math.PI / 2; // Left ray at 90-degree angle
      }

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

        const intersectionNear = intersections[0];
        const intersectionFar = intersections[intersections.length - 1];

        // let intersectionFar;
        // for (let i = intersections.length - 1; i >= 0; i--) {
        //   const intersection = intersections[i];
        //   if (intersection.object.userData['type'] === 'Traffic') {
        //     intersectionFar = intersection;
        //     break;
        //   }
        // }
        //
        // if (!intersectionFar) {
        //   intersectionFar = intersections[intersections.length - 1];
        // }

        const side = i > 0 ? 'Left' : 'Right';
        let subset;
        if (side === 'Right') {
          // console.log('L', intersectionNear.distance);
          subset = [intersectionFar, intersectionNear];
        } else {
          // console.log('R', intersectionNear.distance);
          subset = [intersectionNear, intersectionFar]
        }

        forEach(subset, (intersection: any) => {
          const {point, distance, face} = intersection;
          const offset = this.calculateReach(distance);
          this.readings.push({point, distance, face, offset});
        });

      } else {
        this.readings.push(null);
      }
    }


    if (this.visible) {
      const intersectionGroup = this.car.road.intersectionGroupSides;
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
        .3,
        0x0000ff
      );

      arrowHelper.position.y += 0.05;

      if (this.visible) {
        this.car.road.intersectionGroupSides.add(arrowHelper);
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
      material = new THREE.LineBasicMaterial({color: 0x0000FF});

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
