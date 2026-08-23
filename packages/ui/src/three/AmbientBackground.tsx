import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function WavePlane() {
  const ref = useRef<THREE.Mesh>(null!);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Normalized to plane space (-15..15 matches planeGeometry 30x30)
      targetMouse.current.set(
        (e.clientX / window.innerWidth - 0.5) * 30,
        -(e.clientY / window.innerHeight - 0.5) * 30,
      );
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(({ clock }) => {
    if (document.visibilityState === 'hidden') return;
    const mesh = ref.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.ShaderMaterial;
    // Smooth follow for mouse
    mouse.current.lerp(targetMouse.current, 0.04);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uMouse.value.copy(mouse.current);
  });
  return (
    <mesh ref={ref}>
      <planeGeometry args={[30, 30, 64, 64]} />
      <shaderMaterial
        transparent
        uniforms={{
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uColor: { value: new THREE.Color('#2563eb') },
        }}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  );
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec3 vPos;
  void main() {
    vec3 p = position;
    // Base wave
    p.z += sin(p.x * 0.6 + uTime) * cos(p.y * 0.6 + uTime * 0.8) * 0.9;
    // Mouse pull: nearby vertices lift toward cursor
    float d = distance(p.xy, uMouse);
    float influence = smoothstep(8.0, 0.0, d);
    p.z += influence * 1.4 * sin(uTime * 2.0);
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec2 uMouse;
  varying vec3 vPos;
  void main() {
    float glow = smoothstep(-1.0, 2.0, vPos.z);
    float mouseGlow = smoothstep(6.0, 0.0, distance(vPos.xy, uMouse)) * 0.28;
    float alpha = clamp(glow * 0.35 + mouseGlow, 0.0, 0.62);
    gl_FragColor = vec4(uColor, alpha);
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
      className="pointer-events-none h-full w-full"
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <WavePlane />
    </Canvas>
  );
}
