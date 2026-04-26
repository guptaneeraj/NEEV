import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function CameraController() {
  useFrame((state) => {
    // Camera is static to provide a clean background for the scrolling content
    state.camera.position.set(0, 0, 20);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function Scene3D() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }} alpha>
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={45} />
        <ambientLight intensity={1} />
        <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} />

        <Suspense fallback={null}>
          <CameraController />
          <ContactShadows position={[0, -10, 0]} opacity={0.1} scale={100} blur={4} far={20} />
        </Suspense>
      </Canvas>
    </div>
  );
}
