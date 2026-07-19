import { Animation, CubicEase, EasingFunction } from '@babylonjs/core';
import type { ArcRotateCamera, Scene, TransformNode, Vector3 } from '@babylonjs/core';

const FPS = 30;

export interface CameraWaypoint {
  alpha: number;
  beta: number;
  radius: number;
  target: Vector3;
}

function defaultEasing(): EasingFunction {
  const easing = new CubicEase();
  easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  return easing;
}

/** Camera fly-throughs and generic property tweens, built on Babylon's keyframe Animation system. */
export class AnimationManager {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Smoothly guides an ArcRotateCamera through a sequence of framed shots — a scripted walkthrough. */
  flyThroughWaypoints(
    camera: ArcRotateCamera,
    waypoints: CameraWaypoint[],
    secondsPerLeg = 3,
  ): Promise<void> {
    if (waypoints.length === 0) return Promise.resolve();

    const framesPerLeg = secondsPerLeg * FPS;
    const totalFrames = framesPerLeg * waypoints.length;
    const easing = defaultEasing();

    const alphaAnim = this.buildAnimation('alpha', Animation.ANIMATIONTYPE_FLOAT);
    const betaAnim = this.buildAnimation('beta', Animation.ANIMATIONTYPE_FLOAT);
    const radiusAnim = this.buildAnimation('radius', Animation.ANIMATIONTYPE_FLOAT);
    const targetAnim = this.buildAnimation('target', Animation.ANIMATIONTYPE_VECTOR3);

    [alphaAnim, betaAnim, radiusAnim, targetAnim].forEach((animation) => {
      animation.setEasingFunction(easing);
    });

    alphaAnim.setKeys(waypoints.map((wp, i) => ({ frame: i * framesPerLeg, value: wp.alpha })));
    betaAnim.setKeys(waypoints.map((wp, i) => ({ frame: i * framesPerLeg, value: wp.beta })));
    radiusAnim.setKeys(waypoints.map((wp, i) => ({ frame: i * framesPerLeg, value: wp.radius })));
    targetAnim.setKeys(waypoints.map((wp, i) => ({ frame: i * framesPerLeg, value: wp.target })));

    camera.animations = [alphaAnim, betaAnim, radiusAnim, targetAnim];

    return new Promise((resolve) => {
      this.scene.beginAnimation(camera, 0, totalFrames, false, 1, () => resolve());
    });
  }

  /** Generic single-property tween — position, rotation, scaling, or any Vector3/float field. */
  animateProperty(
    target: TransformNode,
    property: string,
    from: number | Vector3,
    to: number | Vector3,
    durationMs = 800,
  ): Promise<void> {
    const totalFrames = Math.round((durationMs / 1000) * FPS);
    const animationType =
      typeof from === 'number' ? Animation.ANIMATIONTYPE_FLOAT : Animation.ANIMATIONTYPE_VECTOR3;
    const animation = this.buildAnimation(property, animationType);
    animation.setEasingFunction(defaultEasing());
    animation.setKeys([
      { frame: 0, value: from },
      { frame: totalFrames, value: to },
    ]);

    return new Promise((resolve) => {
      this.scene.beginDirectAnimation(target, [animation], 0, totalFrames, false, 1, () =>
        resolve(),
      );
    });
  }

  stopAnimations(target: TransformNode): void {
    this.scene.stopAnimation(target);
  }

  private buildAnimation(property: string, type: number): Animation {
    return new Animation(
      `${property}_anim_${Date.now()}`,
      property,
      FPS,
      type,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
  }

  dispose(): void {
    this.scene.stopAllAnimations();
  }
}
