import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function WaveDots() {
  const ref = useRef<THREE.Points>(null!);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  const positions = useMemo(() => {
    const cols = 64;
    const rows = 64;
    const arr = new Float32Array(cols * rows * 3);
    let idx = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = (i / (cols - 1) - 0.5) * 30;
        const y = (j / (rows - 1) - 0.5) * 30;
        arr[idx++] = x;
        arr[idx++] = y;
        arr[idx++] = 0;
      }
    }
    return arr;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
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
    const points = ref.current;
    if (!points) return;
    const mat = points.material as THREE.ShaderMaterial;
    mouse.current.lerp(targetMouse.current, 0.04);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uColor: { value: new THREE.Color('#2563eb') },
        }}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </points>
  );
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec3 vPos;
  void main() {
    vec3 p = position;
    p.z += sin(p.x * 0.6 + uTime) * cos(p.y * 0.6 + uTime * 0.8) * 0.9;
    float d = distance(p.xy, uMouse);
    float influence = smoothstep(8.0, 0.0, d);
    p.z += influence * 1.4 * sin(uTime * 2.0);
    vPos = p;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 3.8 * (320.0 / -mvPosition.z);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec2 uMouse;
  varying vec3 vPos;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float dist = length(c);
    if (dist > 0.5) discard;
    float glow = smoothstep(-1.0, 2.0, vPos.z);
    float mouseGlow = smoothstep(6.0, 0.0, distance(vPos.xy, uMouse)) * 0.32;
    float alpha = clamp(glow * 0.78 + mouseGlow, 0.0, 0.92);
    float circle = 1.0 - smoothstep(0.32, 0.5, dist);
    gl_FragColor = vec4(uColor, alpha * circle);
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
      <WaveDots />
    </Canvas>
  );
}
