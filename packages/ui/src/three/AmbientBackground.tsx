import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hook to detect and reactively track dark vs light mode from html.dark class.
 */
function useThemeMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    updateTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          updateTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

/**
 * 3D Dotted Wave Mesh:
 * Distinct, separated, crisp dots arranged in a flowing 3D wave terrain
 * with subtle elevation lighting, clean point separation, and gentle mouse interaction.
 */
function DotWaveMesh({ isDark, isMobile }: { isDark: boolean; isMobile: boolean }) {
  const meshRef = useRef<THREE.Points>(null!);
  const starsRef = useRef<THREE.Points>(null!);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  // Structured 2D grid: lightweight on mobile (~3.5k points) for 60fps, rich on desktop (~15k points)
  const { positions, gridIndices } = useMemo(() => {
    const cols = isMobile ? 100 : 210; // across X (width)
    const rows = isMobile ? 38 : 72;   // across Z (depth)
    const total = cols * rows;

    const pos = new Float32Array(total * 3);
    const indices = new Float32Array(total * 2);

    const width = 38.0;
    const depth = 15.5;

    let idx3 = 0;
    let idx2 = 0;

    for (let j = 0; j < rows; j++) {
      const zNorm = j / (rows - 1); // 0.0 to 1.0
      const z = (zNorm - 0.5) * depth;

      for (let i = 0; i < cols; i++) {
        const xNorm = i / (cols - 1); // 0.0 to 1.0
        const x = (xNorm - 0.5) * width;

        pos[idx3] = x;
        pos[idx3 + 1] = 0.0;
        pos[idx3 + 2] = z;
        idx3 += 3;

        indices[idx2] = xNorm * 2.0 - 1.0; // [-1, 1]
        indices[idx2 + 1] = zNorm * 2.0 - 1.0; // [-1, 1]
        idx2 += 2;
      }
    }

    return { positions: pos, gridIndices: indices };
  }, [isMobile]);

  // Soft ambient floating background dust
  const starPositions = useMemo(() => {
    const count = isMobile ? 300 : 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 44;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2.0;
    }
    return arr;
  }, [isMobile]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Map mouse position gently to wave coordinates
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const z = (e.clientY / window.innerHeight - 0.5) * 10;
      targetMouse.current.set(x, z);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Update theme uniforms on mode toggle
  useEffect(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uIsDark.value = isDark ? 1.0 : 0.0;
      mat.needsUpdate = true;
    }
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uIsDark.value = isDark ? 1.0 : 0.0;
      mat.needsUpdate = true;
    }
  }, [isDark]);

  useFrame(({ clock }) => {
    if (document.visibilityState === 'hidden') return;

    // Very soft and gentle mouse smoothing (damping)
    mouse.current.lerp(targetMouse.current, 0.025);
    const t = clock.elapsedTime;

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uMouse.value.copy(mouse.current);
      mat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
    }

    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t * 0.15;
    }
  });

  return (
    <>
      {/* Ambient background dust */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uIsDark: { value: isDark ? 1.0 : 0.0 },
          }}
          vertexShader={STARS_VERT}
          fragmentShader={STARS_FRAG}
        />
      </points>

      {/* 3D Dotted Wave Mesh */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aGrid" args={[gridIndices, 2]} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uIsDark: { value: isDark ? 1.0 : 0.0 },
            uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1 },
          }}
          vertexShader={DOT_WAVE_VERT}
          fragmentShader={DOT_WAVE_FRAG}
        />
      </points>
    </>
  );
}

const DOT_WAVE_VERT = /* glsl */ `
  attribute vec2 aGrid;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uIsDark;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vElevation;

  void main() {
    vec3 p = position;
    float t = uTime * 0.32;

    // Edge fading envelopes so dots taper gracefully
    float xEnv = smoothstep(1.0, 0.45, abs(aGrid.x));
    float zEnv = smoothstep(1.0, 0.35, abs(aGrid.y));
    float env = xEnv * zEnv;

    // Primary flowing wave harmonics creating crests and valleys
    float wave1 = sin(p.x * 0.24 + p.z * 0.28 - t * 0.85) * 1.55;
    float wave2 = cos(p.x * 0.16 - p.z * 0.34 + t * 0.55) * 1.15;
    float wave3 = sin(p.x * 0.42 + p.z * 0.14 - t * 1.1) * 0.35;

    // Center crest emphasis
    float crestShape = sin(aGrid.x * 3.14159 * 0.75) * 0.8 * xEnv;

    float y = (wave1 + wave2 + wave3 + crestShape) * env;

    // Gentle, soft mouse interaction (subtle deflection, not aggressive)
    vec2 mDiff = p.xz - uMouse;
    float mDist = length(mDiff);
    float mInfluence = smoothstep(6.0, 0.0, mDist);
    y += mInfluence * 0.35 * sin(mDist * 0.9 - uTime * 2.0) * env;

    p.y = y - 1.3; // Offset downward so wave flows gracefully beneath headline and text

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Elevation factor for coloring highlights on crests
    vElevation = smoothstep(-1.8, 2.2, p.y);
    vAlpha = env;

    // Crisp, tiny dot sizing with perspective scaling
    // Scaled for high definition without blowing up into blobs
    float baseSize = mix(1.05, 1.25, uIsDark);
    float pSize = baseSize * (0.85 + 0.45 * vElevation) * uPixelRatio * (280.0 / -mvPosition.z);
    gl_PointSize = clamp(pSize, 1.0, 3.6);
  }
`;

const DOT_WAVE_FRAG = /* glsl */ `
  uniform float uIsDark;

  varying float vAlpha;
  varying float vElevation;

  void main() {
    // Crisp circular dot with sharp anti-aliasing
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Sharp edge with minimal anti-alias border to keep dots distinct
    float circle = smoothstep(0.5, 0.25, dist);

    if (uIsDark > 0.5) {
      // --- DARK MODE ---
      // Distinct, crisp silver/white dots with brighter crests
      vec3 darkBase = vec3(0.68, 0.72, 0.82);
      vec3 darkCrest = vec3(1.0, 1.0, 1.0);
      vec3 col = mix(darkBase, darkCrest, vElevation);

      float alpha = circle * vAlpha * mix(0.40, 0.90, vElevation);
      gl_FragColor = vec4(col, alpha);
    } else {
      // --- LIGHT MODE ---
      // Crisp, rich sapphire/cobalt dots with balanced contrast on white background
      vec3 lightBase = vec3(0.18, 0.42, 0.86);
      vec3 lightCrest = vec3(0.10, 0.28, 0.72);
      vec3 col = mix(lightBase, lightCrest, vElevation);

      float alpha = circle * vAlpha * mix(0.38, 0.80, vElevation);
      gl_FragColor = vec4(col, alpha);
    }
  }
`;

const STARS_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uIsDark;
  varying float vTwinkle;

  void main() {
    vec3 p = position;
    p.y += sin(p.x * 0.12 + uTime * 0.8) * 0.12;

    vTwinkle = 0.45 + 0.55 * sin(uTime * 1.5 + p.x * 2.0 + p.y * 1.5);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float base = mix(1.6, 1.2, uIsDark);
    float pSize = base * (280.0 / -mvPosition.z);
    gl_PointSize = clamp(pSize, 1.2, 3.2);
  }
`;

const STARS_FRAG = /* glsl */ `
  uniform float uIsDark;
  varying float vTwinkle;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float circle = smoothstep(0.5, 0.2, dist);

    if (uIsDark > 0.5) {
      vec3 col = vec3(0.9, 0.93, 1.0);
      gl_FragColor = vec4(col, circle * vTwinkle * 0.30);
    } else {
      // In light mode: deep slate-blue ambient dust dots with crisp visibility
      vec3 col = vec3(0.14, 0.32, 0.68);
      gl_FragColor = vec4(col, circle * vTwinkle * 0.42);
    }
  }
`;

/** Ambient-only WebGL layer. Disabled entirely under prefers-reduced-motion. */
export function AmbientBackground() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const isDark = useThemeMode();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAllowed(!mediaQuery.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setAllowed(!e.matches);
    };
    mediaQuery.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  if (allowed === null || !allowed) return null;

  return (
    <Canvas
      className="pointer-events-none h-full w-full"
      camera={{ position: [0, 2.6, 9.4], fov: 48, rotation: [-0.20, 0, 0] }}
      dpr={isMobile ? [1, 1.25] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <DotWaveMesh isDark={isDark} isMobile={isMobile} />
    </Canvas>
  );
}


