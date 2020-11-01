import React, { useRef, Suspense, useMemo, useLayoutEffect } from "react";
import { Canvas, extend, useFrame, useThree } from "react-three-fiber";
import * as THREE from "three";
import {
  OrbitControls,
  useTexture,
  Html,
  Torus,
  Environment,
} from "@react-three/drei";
import {
  DistortedTorusMaterialImpl,
  DistortTorusMaterial,
} from "./DistortedTorusMaterial";
import useSlerp from "./useSlerp";
import roughnessImg from "url:./assets/roughness.jpg";
import normalImg from "url:./assets/normal.jpg";
import displacementImg from "url:./assets/displacement.jpg";
import metalnessImg from "url:./assets/metalness.jpg";
import colorImg from "url:./assets/color.jpg";
import hdrFile from "url:./assets/kloppenheim_02_1k.hdr";
import useDatGui from "./useDatGui";

const Scene = () => {
  const radius = 5;
  const mesh = useRef<THREE.Mesh>();
  const material = useRef<DistortedTorusMaterialImpl>();
  useSlerp(mesh);
  const settings = useDatGui({
    color: {
      type: "color",
      value: "#dba80f",
    },
    metalness: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
    },
    roughness: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
    },
    distort_speed: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
    },
    distort_amplitude: {
      value: 1,
      min: 0,
      max: 5,
      step: 0.01,
    },
    distort_frequency: {
      value: 0.5,
      min: 0,
      max: 2,
      step: 0.01,
    },
  });
  const textures = useTexture([
    roughnessImg,
    normalImg,
    displacementImg,
    metalnessImg,
    colorImg,
  ] as any) as THREE.Texture[];

  const [roughness, normal, displacement, metalness, color] = textures;

  useLayoutEffect(() => {
    textures.forEach(
      (texture) => (
        (texture.wrapT = texture.wrapS = THREE.RepeatWrapping),
        texture.repeat.set(4, 4)
      )
    );
  }, [textures]);

  useFrame(() => {
    material.current.distortSpeed = settings.distort_speed as number;
    material.current.distortAmplitude = settings.distort_amplitude as number;
    material.current.distortFreq = settings.distort_frequency as number;
    material.current.metalness = settings.metalness as number;
    material.current.roughness = settings.roughness as number;
    material.current.color = new THREE.Color(settings.color);
  });
  return (
    <>
      <Torus ref={mesh} args={[radius, 1, 128, 512]}>
        <DistortTorusMaterial
          ref={material}
          radius={radius}
          metalnessMap={metalness}
          roughnessMap={roughness}
          displacementMap={displacement}
          normalMap={normal}
          // map={color}
        />
      </Torus>
    </>
  );
};

const App = () => {
  return (
    <Canvas
      colorManagement
      camera={{ position: [0, 0, 25], near: 0.1, far: 100, fov: 50 }}
    >
      <spotLight intensity={2} position={[0, 30, 40]} />
      <spotLight intensity={2} position={[-50, 30, 40]} />
      {/* <ambientLight intensity={0.5} /> */}
      {/* <OrbitControls /> */}
      <Suspense
        fallback={
          <Html>
            <div>Loading</div>
          </Html>
        }
      >
        <Environment files={hdrFile as any} path="" />
        <Scene />
      </Suspense>
    </Canvas>
  );
};

export default App;
