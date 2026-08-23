import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function WavePlane() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (document.visibilityState === 'hidden') return; // pause when tab hidden
    const mat = ref.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh ref={ref}>
      <planeGeometry args={[30, 30, 64, 64]} />
      <shaderMaterial
        transparent
        uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color('#2563eb') } }}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  );
}

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  void main() {
    vec3 p = position;
    p.z += sin(p.x * 0.6 + uTime) * cos(p.y * 0.6 + uTime * 0.8) * 0.9;
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vPos;
  void main() {
    float glow = smoothstep(-1.0, 2.0, vPos.z);
    gl_FragColor = vec4(uColor, glow * 0.18);
  }
`;

/** Ambient-only WebGL layer. Disabled entirely under prefers-reduced-motion. */
export function AmbientBackground() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    setAllowed(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  if (allowed === null || !allowed) return null;
  return (
    <Canvas
      className="pointer-events-none absolute inset-0 -z-10"
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <WavePlane />
    </Canvas>
  );
}
