import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function RibbonWave() {
  const ribbonRef = useRef<THREE.Points>(null!);
  const starsRef = useRef<THREE.Points>(null!);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  const ribbonPositions = useMemo(() => {
    const cols = 80;
    const rows = 18;
    const width = 32;
    const height = 7;
    const arr = new Float32Array(cols * rows * 3);
    let idx = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = (i / (cols - 1) - 0.5) * width;
        const y = (j / (rows - 1) - 0.5) * height;
        arr[idx++] = x;
        arr[idx++] = y;
        arr[idx++] = 0;
      }
    }
    return arr;
  }, []);

  const starPositions = useMemo(() => {
    const count = 1200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 36;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 28;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1.5;
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
    mouse.current.lerp(targetMouse.current, 0.04);
    const t = clock.elapsedTime;
    for (const ref of [ribbonRef, starsRef]) {
      const mesh = ref.current;
      if (!mesh) continue;
      const mat = mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uMouse.value.copy(mouse.current);
    }
    // Gentle drift for stars
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = clock.elapsedTime * 0.15;
    }
  });

  return (
    <>
      {/* Background starfield: faint, slow */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uColor: { value: new THREE.Color('#6b7280') },
          }}
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
        />
      </points>
      {/* Traveling ribbon: dense, wave that moves left to right */}
      <points ref={ribbonRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ribbonPositions, 3]} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uColor: { value: new THREE.Color('#2563eb') },
          }}
          vertexShader={RIBBON_VERT}
          fragmentShader={RIBBON_FRAG}
        />
      </points>
    </>
  );
}

const RIBBON_VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec3 vPos;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // Traveling wave: phase moves in +X direction
    float wave = sin((p.x - uTime * 2.2) * 0.52) * 1.4;
    // Cross twist
    wave *= cos(p.y * 0.42 + uTime * 0.35);
    // Fade edges of ribbon
    float edge = smoothstep(16.0, 9.0, abs(p.x)) * smoothstep(3.6, 2.0, abs(p.y));
    p.z += wave * edge;
    // Mouse pull creates a bulge
    float d = distance(p.xy, uMouse);
    float influence = smoothstep(9.0, 0.0, d);
    p.z += influence * 1.1;
    vPos = p;
    vAlpha = edge;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 3.2 * (340.0 / -mvPosition.z);
  }
`;
const RIBBON_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec2 uMouse;
  varying vec3 vPos;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float dist = length(c);
    if (dist > 0.5) discard;
    float glow = smoothstep(-1.2, 1.8, vPos.z);
    float mouseGlow = smoothstep(7.0, 0.0, distance(vPos.xy, uMouse)) * 0.3;
    float alpha = clamp((glow * 0.82 + mouseGlow) * vAlpha, 0.0, 0.88);
    float circle = 1.0 - smoothstep(0.32, 0.5, dist);
    gl_FragColor = vec4(uColor, alpha * circle);
  }
`;

const STAR_VERT = /* glsl */ `
  uniform float uTime;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    p.y += sin(p.x * 0.18 + uTime) * 0.08;
    vTwinkle = 0.55 + 0.45 * sin(uTime * 0.9 + p.x * 1.7);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 1.4 * (320.0 / -mvPosition.z);
  }
`;
const STAR_FRAG = /* glsl */ `
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    if (length(c) > 0.5) discard;
    float circle = 1.0 - smoothstep(0.34, 0.5, length(c));
    gl_FragColor = vec4(vec3(1.0), 0.22 * vTwinkle * circle);
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
      camera={{ position: [0, 0, 9], fov: 58 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <RibbonWave />
    </Canvas>
  );
}
