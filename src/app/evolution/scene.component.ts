import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as _ from 'lodash';
import {EngineMl} from './engine-ml';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent {


  width: number = 0;
  height: number = 0;
  // gui: dat.GUI;
  container: any;
  scene: any
  camera: any;
  clock = new THREE.Clock();

  renderer: any;
  controls: any;
  pauseBtn: string = "PAUSE";
  autoPilotBtn: string = "ON";

  engineML!: EngineMl;


  constructor() {
    console.log('SceneComponent');
    // this.gui = new dat.GUI();
  }

  ngAfterViewInit(): void {
    this.container = document.getElementById('container');
    this.setup(this.container);
  }

  setup(container: any) {
    // Create the scene and camera
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.camera.position.z = 0;
    this.camera.position.y = 10;
    this.camera.position.x = 0;

    // const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);

    this.createGUI();

    this.renderer = new THREE.WebGLRenderer({antialias: true});

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;

    container.appendChild(this.renderer.domElement);
    container.addEventListener('click', this.onContainerClick);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    window.addEventListener('resize', this.resize.bind(this));

    const networkCanvas: any = document.getElementById("networkCanvas");
    networkCanvas.width = 400;
    networkCanvas.height = 400;
    const networkCtx = networkCanvas.getContext("2d");
    this.adjustLighting();

    this.engineML = new EngineMl(this, networkCtx);
    this.engineML.init();
    this.render();
  }

  adjustLighting() {

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff);
    hemiLight.position.set(0, 30, 0);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 30, 0);
    dirLight.castShadow = true;
    const frustumSize = 10; // Adjust this value according to your scene's scale

    dirLight.shadow.camera.top = frustumSize;
    dirLight.shadow.camera.bottom = -frustumSize;
    dirLight.shadow.camera.left = -frustumSize;
    dirLight.shadow.camera.right = frustumSize;

    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1000;
    // dirLight.shadow.bias = 0;

    dirLight.shadow.mapSize.width = 1024; // Adjust according to your needs
    dirLight.shadow.mapSize.height = 1024;

    this.scene.add(hemiLight, dirLight);
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
    if (this.engineML.isRunning) return;
    const time = this.clock.getElapsedTime();
    this.engineML.update(time);
  }

  createCamera(): any {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    return camera;
  }


  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  createGUI(): any {
    // const folder = this.gui.addFolder('PID Controller');
    // folder.open(); // Open the folder by default
  }

  onContainerClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // const intersects = raycaster.intersectObjects(this.borders);
    // if (intersects.length > 0) {

    // }
  };


  onSave() {
    this.engineML.onSave();
  }

  onDelete() {
    this.engineML.onDelete();
  }

  onPause() {
    this.engineML.isRunning = !this.engineML?.isRunning;
    this.pauseBtn = this.engineML?.isRunning ? "RESUME" : "PAUSE";
  }

  onAutoPilot(){
    this.engineML.isAutoPilot = !this.engineML?.isAutoPilot;
    this.autoPilotBtn = this.engineML?.isAutoPilot ? "ON" : "OFF";
    this.engineML.onAutoPilot();
  }

  get brainListing() {
    return _.orderBy(this.engineML?.brains, 'version', 'desc');
  }

  get brainVersion() {
    return this.engineML?.brainVersion;
  }

  get carsRunning() {
    return this.engineML?.carsRunning;
  }

  get canSave() {
    // console.log(this.engineML?.lastY > this.engineML?.lastDistance)
    return !(this.engineML?.lastY > this.engineML?.lastDistance);
  }

  get lastY() {
    return this.engineML?.lastY;
  }

  get bestDistance() {
    return this.engineML?.lastDistance;
  }

  get car() {
    return this.engineML?.car;
  }
}
