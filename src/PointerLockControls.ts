import * as THREE from 'three';

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _vector = new THREE.Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class PointerLockControls extends THREE.EventDispatcher {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private minPolarAngle: number;
  private maxPolarAngle: number;
  private pointerSpeed: number;

  public isLocked: boolean;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    super();

    this.domElement = domElement;
    this.camera = camera;
    this.isLocked = false;

    // Set to constrain the pitch of the camera
    // Range is 0 to Math.PI radians
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    this.pointerSpeed = 1.0;

    this.connect();
  }

  onMouseMove = (event: MouseEvent): void => {
    if (this.isLocked === false) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    _euler.setFromQuaternion(this.camera.quaternion);

    _euler.y -= movementX * 0.002 * this.pointerSpeed;
    _euler.x -= movementY * 0.002 * this.pointerSpeed;

    _euler.x = Math.max(
      _PI_2 - this.maxPolarAngle,
      Math.min(_PI_2 - this.minPolarAngle, _euler.x)
    );

    this.camera.quaternion.setFromEuler(_euler);

    this.dispatchEvent(_changeEvent);
  };

  onPointerlockChange = (): void => {
    if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
      this.dispatchEvent(_lockEvent);

      this.isLocked = true;
    } else {
      this.dispatchEvent(_unlockEvent);

      this.isLocked = false;
    }
  };

  onPointerlockError = (): void => {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
  };

  connect = (): void => {
    this.domElement.ownerDocument.addEventListener(
      'mousemove',
      this.onMouseMove
    );
    this.domElement.ownerDocument.addEventListener(
      'pointerlockchange',
      this.onPointerlockChange
    );
    this.domElement.ownerDocument.addEventListener(
      'pointerlockerror',
      this.onPointerlockError
    );
  };

  disconnect = (): void => {
    this.domElement.ownerDocument.removeEventListener(
      'mousemove',
      this.onMouseMove
    );
    this.domElement.ownerDocument.removeEventListener(
      'pointerlockchange',
      this.onPointerlockChange
    );
    this.domElement.ownerDocument.removeEventListener(
      'pointerlockerror',
      this.onPointerlockError
    );
  };

  dispose = (): void => {
    this.disconnect();
  };

  getObject = (): THREE.PerspectiveCamera => {
    // retaining this method for backward compatibility
    return this.camera;
  };

  getDirection = (function (scope: PointerLockControls) {
    const direction = new THREE.Vector3(0, 0, -1);

    return function (v: THREE.Vector3) {
      return v.copy(direction).applyQuaternion(scope.camera.quaternion);
    };
  })(this);

  moveForward = (distance: number): void => {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up

    _vector.setFromMatrixColumn(this.camera.matrix, 0);
    _vector.crossVectors(this.camera.up, _vector);
    this.camera.position.addScaledVector(_vector, distance);
  };

  moveRight = (distance: number): void => {
    _vector.setFromMatrixColumn(this.camera.matrix, 0);
    this.camera.position.addScaledVector(_vector, distance);
  };

  lock = (): void => {
    this.domElement.requestPointerLock();
  };

  unlock = (): void => {
    this.domElement.ownerDocument.exitPointerLock();
  };
}

export { PointerLockControls };
