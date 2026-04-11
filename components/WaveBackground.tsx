"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function WaveMesh({ offset = 0, opacity = 0.6 }) {
  const meshRef = useRef<THREE.Points>(null);

  const count = 100; // 🔥 more width coverage
  const positions = new Float32Array(count * count * 3);

  let i = 0;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      positions[i++] = (x - count / 2) / 4; // 🔥 wider spread
      positions[i++] = 0;
      positions[i++] = (y - count / 2) / 4;
    }
  }

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pos = meshRef.current!.geometry.attributes.position.array as Float32Array;

    let i = 0;
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        const idx = i + 1;

        pos[idx] =
          Math.sin(x * 0.25 + time + offset) * 0.4 + // 🔥 bigger wave
          Math.cos(y * 0.25 + time + offset) * 0.4;

        i += 3;
      }
    }

    meshRef.current!.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>

      <pointsMaterial
        size={0.06} // 🔥 bigger dots
        color="#f97316"
        transparent
        opacity={opacity}
      />
    </points>
  );
}

export default function WaveBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">

      {/* 🔥 BIG GLOW */}
      <div className="absolute w-[900px] h-[400px] bg-orange-300 opacity-25 blur-3xl rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* 🔥 FULL WIDTH CANVAS */}
      <div className="absolute inset-0">

        <Canvas camera={{ position: [0, 3, 7], fov: 65 }}>
          <color attach="background" args={["#fafafa"]} />

          {/* MAIN WAVE */}
          <WaveMesh offset={0} opacity={0.65} />

          {/* SECOND LAYER */}
          <WaveMesh offset={2} opacity={0.35} />

        </Canvas>

      </div>
    </div>
  );
}