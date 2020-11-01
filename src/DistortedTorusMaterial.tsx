import {
  MeshPhysicalMaterial,
  MeshPhysicalMaterialParameters,
  Shader,
} from "three";
import React, { useState } from "react";
import snoise from "./shader/snoise.glsl";
import { useFrame } from "react-three-fiber";

export class DistortedTorusMaterialImpl extends MeshPhysicalMaterial {
  private _time: { value: number };
  private _radius: { value: number };
  private _distortSpeed: { value: number };
  private _distortFreq: { value: number };
  private _distortAmplitude: { value: number };
  private _threshold: { value: number };
  constructor(parameters?: MeshPhysicalMaterialParameters) {
    super(parameters);
    this._time = {
      value: 0,
    };
    this._radius = {
      value: 0,
    };
    this._distortSpeed = {
      value: 1,
    };
    this._distortFreq = {
      value: 1,
    };
    this._distortAmplitude = {
      value: 1,
    };
    this._threshold = {
      value: 0.3,
    };
  }

  onBeforeCompile(shader: Shader) {
    shader.uniforms.uTime = this._time;
    shader.uniforms.uRadius = this._radius;
    shader.uniforms.uDistortAmplitude = this._distortAmplitude;
    shader.uniforms.uDistortSpeed = this._distortSpeed;
    shader.uniforms.uDistortFreq = this._distortFreq;
    shader.uniforms.uThreshold = this._threshold;

    shader.vertexShader = `
      uniform float uTime;
      uniform float uRadius;
      uniform float uDistortFreq;
      uniform float uDistortSpeed;
      uniform float uDistortAmplitude;
      uniform float uThreshold;
      varying vec3 vPosition;

      ${snoise}

      vec3 distortTorus(vec3 position, float radius, float factor, float noiseSize, float noiseSpeed) {
        vec3 proj = normalize(vec3(position.xy, 0.)) * radius; // projects position vector to xy plane with length of radius
        vec3 sphere = position - proj;
        float noiseFactor = snoise(
          vec3(
            position.x * noiseSize + uTime * noiseSpeed, 
            position.y * noiseSize + uTime * noiseSpeed, 
            position.z * noiseSize + uTime * noiseSpeed
          )
        ) * factor;
        sphere = normalize(sphere) * (length(sphere) + noiseFactor);
        return proj + sphere;
      }

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
    #include <project_vertex>

    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    float noiseF = snoise(vec3(worldPos.xyz / 40.0 + uTime * 0.2));
    if (noiseF > uThreshold) {
      float factor = uDistortAmplitude * (noiseF - uThreshold);
      transformed = distortTorus(transformed, uRadius, factor, uDistortFreq, uDistortSpeed);
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    `
    );

    shader.fragmentShader = `
      uniform float uTime;
      varying vec3 vPosition;

      ${snoise}

      vec3 grayscale(vec3 color) {
        float g = dot(color, vec3(0.299, 0.587, 0.114));
        return vec3(g);
      }

      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `
    #include <dithering_fragment>

    float noise = snoise(vec3(vPosition / 20.0 + uTime * 0.1));
    if (noise > 0.5) {
      gl_FragColor = vec4(grayscale(gl_FragColor.rgb), gl_FragColor.a);
    }
    `
    );
  }

  get time() {
    return this._time.value;
  }

  set time(t: number) {
    this._time.value = t;
  }

  get radius() {
    return this._radius.value;
  }

  set radius(r: number) {
    this._radius.value = r;
  }

  get distortFreq() {
    return this._distortFreq.value;
  }

  set distortFreq(f: number) {
    this._distortFreq.value = f;
  }

  get distortSpeed() {
    return this._distortSpeed.value;
  }

  set distortSpeed(s: number) {
    this._distortSpeed.value = s;
  }

  get distortAmplitude() {
    return this._distortAmplitude.value;
  }

  set distortAmplitude(a: number) {
    this._distortAmplitude.value = a;
  }

  get threshold() {
    return this._threshold.value;
  }

  set threshold(t: number) {
    this._threshold.value = t;
  }
}

export type DistortTorusMaterialProps = THREE.MeshPhysicalMaterialParameters & {
  radius: number;
  distortAmplitude?: number;
  distortFreq?: number;
  distortSpeed?: number;
  threshold?: number;
};

export const DistortTorusMaterial = React.forwardRef<
  DistortedTorusMaterialImpl,
  DistortTorusMaterialProps
>((props, ref) => {
  const [material] = useState(() => new DistortedTorusMaterialImpl());
  useFrame((state) => {
    if (material) {
      material.time = state.clock.getElapsedTime();
    }
  });
  return <primitive object={material} ref={ref} attach="material" {...props} />;
});
