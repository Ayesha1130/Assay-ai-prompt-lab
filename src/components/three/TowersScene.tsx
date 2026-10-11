"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";

import type { CaseResult, Side } from "@/lib/engine/types";
import { FAIL_HEX, SIDE_STYLE } from "@/lib/side";

const SPACING = 0.95;
const WAITING = "#272c55";

interface ColumnProps {
  x: number;
  z: number;
  side: Side;
  result?: CaseResult;
}

/** One column per answer. Tall and bright means it passed, short with a coral cap means it failed. */
function Column({ x, z, side, result }: ColumnProps) {
  const body = useRef<THREE.Mesh>(null);
  const cap = useRef<THREE.Mesh>(null);

  const target = !result ? 0.06 : result.error ? 0.12 : result.pass ? 0.5 + 1.6 * Math.max(result.score, 0.6) : 0.18 + 0.5 * result.score;
  const failed = Boolean(result && !result.pass);
  const color = !result ? WAITING : SIDE_STYLE[side].hex;

  useFrame((_, dt) => {
    if (!body.current) return;
    const h = THREE.MathUtils.damp(body.current.scale.y, target, 5, dt);
    body.current.scale.y = h;
    body.current.position.y = h / 2;
    if (cap.current) cap.current.position.y = h + 0.07;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={body} scale={[1, 0.06, 1]}>
        <boxGeometry args={[0.4, 1, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={result?.pass ? 0.55 : 0.08}
          roughness={0.35}
          metalness={0.2}
          opacity={failed ? 0.55 : 1}
          transparent={failed}
        />
      </mesh>
      {failed ? (
        <mesh ref={cap}>
          <boxGeometry args={[0.46, 0.08, 0.46]} />
          <meshBasicMaterial color={FAIL_HEX} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

export interface TowersSceneProps {
  caseIds: string[];
  results: CaseResult[];
  animate: boolean;
}

export default function TowersScene({ caseIds, results, animate }: TowersSceneProps) {
  const n = caseIds.length;
  const distance = Math.max(7.5, n * SPACING * 0.62 + 3);
  const lookup = new Map<string, CaseResult>();
  for (const r of results) lookup.set(`${r.side}:${r.caseId}`, r);

  return (
    <Canvas
      key={n}
      dpr={[1, 1.75]}
      camera={{ position: [0, distance * 0.42, distance], fov: 36 }}
      frameloop={animate ? "always" : "demand"}
      aria-hidden="true"
    >
      <color attach="background" args={["#11142a"]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[-6, 5, 4]} intensity={80} color={SIDE_STYLE.A.hex} />
      <pointLight position={[6, 5, 4]} intensity={80} color={SIDE_STYLE.B.hex} />
      <directionalLight position={[0, 6, 3]} intensity={0.5} />

      <group>
        {caseIds.map((id, i) => {
          const x = (i - (n - 1) / 2) * SPACING;
          return (
            <group key={id}>
              <Column x={x} z={-0.28} side="A" result={lookup.get(`A:${id}`)} />
              <Column x={x} z={0.28} side="B" result={lookup.get(`B:${id}`)} />
            </group>
          );
        })}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <planeGeometry args={[Math.max(14, n * SPACING + 4), 8]} />
          <meshStandardMaterial color="#0a0c18" roughness={0.9} />
        </mesh>
        <gridHelper args={[Math.max(14, n * SPACING + 4), Math.max(14, n * 2 + 8), "#272c55", "#181c38"]} position={[0, 0.002, 0]} />
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={animate}
        autoRotateSpeed={0.5}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2.15}
      />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.35} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
