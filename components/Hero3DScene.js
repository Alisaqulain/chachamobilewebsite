"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function FloatingKnot() {
  const mesh = useRef(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.22;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.55}>
      <mesh ref={mesh} scale={1.05}>
        <torusKnotGeometry args={[0.52, 0.19, 128, 32]} />
        <meshPhysicalMaterial
          color="#ff6600"
          metalness={0.55}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.12}
          emissive="#331a00"
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

function SecondaryOrb() {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.35;
    ref.current.position.y = Math.cos(state.clock.elapsedTime * 0.4) * 0.2;
  });
  return (
    <mesh ref={ref} position={[1.1, -0.35, 0.5]}>
      <icosahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.35}
        roughness={0.25}
        emissive="#ff6600"
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

export default function Hero3DScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3.8], fov: 42 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      className="h-full w-full"
    >
      <ambientLight intensity={0.4} />
      <spotLight position={[8, 8, 6]} intensity={1.1} angle={0.35} penumbra={0.9} castShadow />
      <pointLight position={[-4, 2, 2]} intensity={0.6} color="#ff6600" />
      <FloatingKnot />
      <SecondaryOrb />
      <Sparkles
        count={36}
        scale={[4.5, 3.2, 2]}
        position={[0, 0, -0.5]}
        size={1.8}
        speed={0.25}
        opacity={0.45}
        color="#ff6600"
      />
    </Canvas>
  );
}
