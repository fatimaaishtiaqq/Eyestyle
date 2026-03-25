import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Simple geometry switcher so we can use different shapes per page
const ShapeGeometry = ({ kind, radius }) => {
    switch (kind) {
        case 'cube':
            return <boxGeometry args={[radius * 1.5, radius * 1.5, radius * 1.5]} />;
        case 'torus':
            return <torusKnotGeometry args={[radius * 0.8, radius * 0.3, 128, 32]} />;
        case 'diamond':
            return <octahedronGeometry args={[radius * 1.2, 1]} />;
        case 'pill':
            return <capsuleGeometry args={[radius * 0.8, radius * 2, 12, 24]} />;
        case 'sphere':
        default:
            return <sphereGeometry args={[radius * 1.1, 32, 32]} />;
    }
};

const FloatingShape = ({ position, color, speed, radius, kind, scrollRef, mouseRef }) => {
    const meshRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const scroll = scrollRef?.current || 0;
        const scrollFactor = Math.min(scroll / 800, 2);

        // Mouse parallax
        const mouseX = mouseRef.current.x * 2;
        const mouseY = mouseRef.current.y * 2;

        if (meshRef.current) {
            meshRef.current.rotation.x = time * 0.2 + scrollFactor * 0.5 + mouseY * 0.2;
            meshRef.current.rotation.y = time * 0.25 + scrollFactor * 0.8 + mouseX * 0.2;
            meshRef.current.position.y = position[1] + Math.sin(time * speed + position[0]) * (0.8 + scrollFactor * 0.2) - mouseY * 0.5;
            meshRef.current.position.x = position[0] + mouseX * 0.5;
        }
    });

    return (
        <Float speed={speed} rotationIntensity={1.5} floatIntensity={1.5}>
            <mesh ref={meshRef} position={position}>
                <ShapeGeometry kind={kind} radius={radius} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.9}
                    roughness={0.1}
                    transparent
                    opacity={0.85}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </mesh>
        </Float>
    );
};

const BackgroundParticles = ({ count = 250, spread = 50 }) => {
    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * spread;
            pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
            pos[i * 3 + 2] = (Math.random() - 0.5) * -spread;
        }
        return [pos];
    }, [count, spread]);

    const pointsRef = useRef();

    useFrame(() => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += 0.0004;
            pointsRef.current.rotation.x += 0.0002;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.08} color="#ffffff" transparent opacity={0.4} sizeAttenuation />
        </points>
    );
};

// Different scene recipes — reduced particle counts for smoother scroll
const SCENES = {
    home: {
        particles: 120,
        objects: [
            { kind: 'torus', position: [-9, 5, -10], color: '#FFD700', speed: 1.2, radius: 3.5 },
            { kind: 'diamond', position: [10, -4, -8], color: '#00BFFF', speed: 0.8, radius: 2.8 },
            { kind: 'sphere', position: [4, 7, -12], color: '#FF1493', speed: 1.5, radius: 2.2 },
        ],
    },
    collection: {
        particles: 60,
        objects: [
            { kind: 'cube', position: [-10, 3, -9], color: '#9370DB', speed: 1, radius: 3 },
            { kind: 'torus', position: [11, -5, -11], color: '#00FA9A', speed: 1.3, radius: 2.5 },
            { kind: 'sphere', position: [0, 8, -8], color: '#FF4500', speed: 0.9, radius: 2 },
        ],
    },
    product: {
        particles: 50,
        objects: [
            { kind: 'diamond', position: [-8, 4, -10], color: '#FF8C00', speed: 1.1, radius: 3.2 },
            { kind: 'pill', position: [7, -3, -8], color: '#1E90FF', speed: 0.7, radius: 2.4 },
            { kind: 'sphere', position: [0, 9, -12], color: '#ADFF2F', speed: 1.4, radius: 1.8 },
        ],
    },
    cart: {
        particles: 70,
        objects: [
            { kind: 'cube', position: [-6, 4, -8], color: '#00CED1', speed: 0.9, radius: 2.5 },
            { kind: 'torus', position: [8, -4, -10], color: '#FF6347', speed: 1.2, radius: 2.2 },
        ],
    },
    auth: {
        particles: 70,
        objects: [
            { kind: 'diamond', position: [-5, 4, -8], color: '#7B68EE', speed: 1, radius: 2.8 },
            { kind: 'pill', position: [7, -3, -9], color: '#DAA520', speed: 1.2, radius: 2.5 },
        ],
    },
    default: {
        particles: 80,
        objects: [
            { kind: 'sphere', position: [-9, 5, -10], color: '#FFD700', speed: 1, radius: 3 },
            { kind: 'sphere', position: [10, -5, -8], color: '#C0C0C0', speed: 1.2, radius: 2.5 },
            { kind: 'sphere', position: [4, 7, -11], color: '#F0F0F0', speed: 0.8, radius: 2 },
        ],
    },
};

const ThreeBackground = ({ variant = 'default' }) => {
    const scrollRef = useRef(0);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Defer enabling the 3D background until after first paint.
        // Skip entirely on small screens and for users who prefer reduced motion.
        const isMobile = window.innerWidth < 768;
        const prefersReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isMobile || prefersReduce) {
            return;
        }

        let idleId;
        let timeoutId;

        if (typeof window.requestIdleCallback === 'function') {
            idleId = window.requestIdleCallback(
                () => setShouldRender(true),
                { timeout: 200 }
            );
        } else {
            timeoutId = window.setTimeout(() => setShouldRender(true), 80);
        }

        return () => {
            if (idleId && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    useEffect(() => {
        if (!shouldRender) return;

        const handleScroll = () => {
            scrollRef.current = window.scrollY || window.pageYOffset || 0;
        };

        const handleMouseMove = (e) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [shouldRender]);

    if (!shouldRender) return null;

    const scene = SCENES[variant] || SCENES.default;

    return (
        <div
            className="fixed inset-0 hidden md:block"
            style={{
                zIndex: 0,
                opacity: 0.45,
                background: 'transparent',
                pointerEvents: 'none',
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 18], fov: 50 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
                dpr={[1, 1.8]}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[15, 15, 15]} intensity={1.1} />
                    <spotLight position={[-15, 15, 10]} angle={0.22} penumbra={0.9} intensity={1.4} />

                    {scene.objects.map((obj, idx) => (
                        <FloatingShape key={idx} scrollRef={scrollRef} mouseRef={mouseRef} {...obj} />
                    ))}

                    <BackgroundParticles count={scene.particles} />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default React.memo(ThreeBackground);
