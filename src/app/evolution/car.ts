import * as THREE from 'three';
import {Box3, Mesh, Object3D} from 'three';
import {Road} from './road';
import {CarBrain} from './car-brain';

export class Car extends Object3D {
  x: number;
  y: number;
  speed: number;
  angleSpeed: number;
  acceleration: number;
  maxSpeed: number;
  friction: number;
  angle: number;
  road!: Road;

  smart: boolean = false;
  uid: number = 0;

  isOn: boolean = true;

  hasSensors: boolean;

  dico!: { name: string, mesh: Mesh, box: Box3 };
  box!: Mesh;
  mesh: any;
  wire: any;
  autonomous: boolean = true;

  carBrain!: CarBrain;

  constructor(x: number, y: number, road: Road, hasSensors: boolean = true) {
    super();

    this.x = x;
    this.y = y;
    this.speed = 0;
    this.angleSpeed = 0.01;
    this.acceleration = 0.1;
    this.maxSpeed = .2;
    this.friction = 0.005;
    this.angle = 0;
    this.road = road;
    const color = hasSensors ? 0xffaa00 : 0x00aaff;
    const depth = hasSensors ? 2 : 2;
    this.wire = this.createWireFrameBox(1, .5, depth);
    this.mesh = this.createBox(1, .5, depth, color);
    const box = new THREE.Box3().setFromObject(this.mesh);
    const name = hasSensors ? 'car' : 'traffic';
    this.dico = {name, mesh: this.mesh, box};
    this.add(this.mesh, this.wire);
    this.hasSensors = hasSensors;
    if (hasSensors) {
      this.carBrain = new CarBrain(this, this.road);
    }

    this.wire.visible = false;
  }

  update(time: number): void {

    if (this.hasSensors) {
      this.move();
      this.carBrain.update(time);

      if (this.autonomous) {

        if (this.carBrain.outputs[0] && this.carBrain.outputs[1]) {
          this.isOn = false; // kill bad brain
        }

        this.carBrain.controls.left = this.carBrain.outputs[0];
        this.carBrain.controls.right = this.carBrain.outputs[1];
        this.carBrain.controls.forward = true;
      }

    }

    if (!this.isOn) {
      this.speed = 0;
      this.acceleration = 0;
      this.smart = false;
      this.visible = false;
    }

    this.applyStyle();
  }



  private move(): void {

    if (this.carBrain.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.carBrain.controls.reverse) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2;
    }

    if (this.speed > 0) {
      this.speed -= this.friction;
    }
    if (this.speed < 0) {
      this.speed += this.friction;
    }
    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0;
    }

    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (this.carBrain.controls.left) {
        this.angle += this.angleSpeed * flip;
      }
      if (this.carBrain.controls.right) {
        this.angle -= this.angleSpeed * flip;
      }
    }

    this.position.x -= Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
    this.rotation.y = this.angle;
  }

  createBox(width: number, height: number, depth: number, color: number): any {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material: any = new THREE.MeshPhongMaterial({color});
    material.transparent = true;
    this.box = new THREE.Mesh(geometry, material);
    this.box.userData['type'] = 'Traffic';
    this.box.castShadow = true;
    return this.box;
  }

  createWireFrameBox(width: number, height: number, depth: number): any {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: .3,
      blending: THREE.AdditiveBlending,
    }));


    return mesh;
  }

  applyStyle() {
    this.mesh.visible = this.smart;
    this.wire.visible = !this.smart;
    const s = this.smart ? 1 : .99;
    this.scale.set(s, s, s);
  }

}
