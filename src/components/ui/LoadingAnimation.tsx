'use client'

import { useEffect, useState } from 'react'

interface LoadingAnimationProps {
    onComplete: () => void
}

export default function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
    const [stage, setStage] = useState(0)
    const [particles, setParticles] = useState<Array<{
        id: number;
        x: number;
        y: number;
        delay: number;
        size: number;
        colorClass: string;
        speedClass: string;
    }>>([])

    useEffect(() => {
        // Generate dynamic floating particles with different properties
        const colorClasses = ['bg-blue-400/60', 'bg-purple-400/60', 'bg-cyan-400/60', 'bg-pink-400/60']
        const speedClasses = ['animate-float-slow', 'animate-float-medium', 'animate-float-fast']

        const newParticles = Array.from({ length: 25 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 3000,
            size: Math.random() * 3 + 2,
            colorClass: colorClasses[Math.floor(Math.random() * colorClasses.length)],
            speedClass: speedClasses[Math.floor(Math.random() * speedClasses.length)]
        }))
        setParticles(newParticles)

        // Smooth animation stages with better timing
        const timer1 = setTimeout(() => setStage(1), 200)   // Show center orb
        const timer2 = setTimeout(() => setStage(2), 600)   // Show orbital rings
        const timer3 = setTimeout(() => setStage(3), 1200)  // Show energy waves
        const timer4 = setTimeout(() => setStage(4), 1800)  // Show text
        const timer5 = setTimeout(() => setStage(5), 2400)  // Complete transformation
        const timer6 = setTimeout(() => onComplete(), 3000) // Finish

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            clearTimeout(timer4)
            clearTimeout(timer5)
            clearTimeout(timer6)
        }
    }, [onComplete])

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center z-50 overflow-hidden">
            {/* Dynamic Background Particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className={`absolute rounded-full ${particle.colorClass} ${particle.speedClass}`}
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animationDelay: `${particle.delay}ms`
                    }}
                />
            ))}

            {/* Cosmic Background Waves */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/10 via-indigo-500/10 to-violet-500/10 animate-pulse animate-delay-1000"></div>
            </div>

            {/* Main Cosmic Loader */}
            <div className="relative flex flex-col items-center">
                {/* Central Energy Orb */}
                <div className="relative">
                    {/* Outer Energy Ring */}
                    <div className={`absolute inset-0 w-32 h-32 rounded-full transition-all duration-1500 ${stage >= 2 ? 'scale-100 opacity-100 animate-spin-slow' : 'scale-0 opacity-0'
                        } cosmic-gradient blur-sm`} />

                    {/* Middle Orbital Ring */}
                    <div className={`absolute inset-2 w-28 h-28 rounded-full border-2 border-gradient-cyan-purple transition-all duration-1500 ${stage >= 2 ? 'scale-100 opacity-80 animate-spin-reverse animate-delay-300' : 'scale-0 opacity-0'
                        }`} />

                    {/* Inner Pulse Ring */}
                    <div className={`absolute inset-4 w-24 h-24 rounded-full border border-pink-400 transition-all duration-1500 ${stage >= 2 ? 'scale-100 opacity-60 animate-pulse-ring animate-delay-600' : 'scale-0 opacity-0'
                        }`} />

                    {/* Central Core */}
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1500 ${stage >= 1 ? 'scale-100 opacity-100 animate-core-glow' : 'scale-0 opacity-0'
                        } core-gradient core-shadow`}>
                        {/* Holographic Icon */}
                        <div className="relative">
                            <svg
                                className={`w-16 h-16 text-white drop-shadow-2xl ${stage >= 1 ? 'animate-icon-float' : ''
                                    }`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}
                            >
                                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Energy Waves */}
                {stage >= 3 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full border border-blue-400/30 animate-ping-slow"></div>
                        <div className="absolute w-64 h-64 rounded-full border border-purple-400/20 animate-ping-medium animate-delay-500"></div>
                        <div className="absolute w-80 h-80 rounded-full border border-pink-400/10 animate-ping-fast animate-delay-1000"></div>
                    </div>
                )}

                {/* Holographic Text */}
                {stage >= 4 && (
                    <div className="mt-16 text-center">
                        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-text-glow">
                            Career Guidance
                        </div>
                        <div className={`text-xl text-cyan-300 font-light tracking-wider transition-all duration-1000 ${stage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            } text-glow-cyan`}>
                            Illuminating Your Path to Success
                        </div>
                    </div>
                )}

                {/* Quantum Loading Indicators */}
                {stage >= 4 && (
                    <div className="flex space-x-4 mt-12">
                        <div className="w-3 h-3 rounded-full bg-blue-400 animate-quantum-bounce"></div>
                        <div className="w-3 h-3 rounded-full bg-purple-400 animate-quantum-bounce animate-delay-200"></div>
                        <div className="w-3 h-3 rounded-full bg-pink-400 animate-quantum-bounce animate-delay-400"></div>
                        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-quantum-bounce animate-delay-600"></div>
                    </div>
                )}
            </div>

            {/* Final Transformation Effect */}
            {stage >= 5 && (
                <div className="absolute inset-0 animate-sweep">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-fade-in"></div>
                </div>
            )}

            <style jsx>{`
                .cosmic-gradient {
                    background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4, #3b82f6);
                }
                
                .core-gradient {
                    background: radial-gradient(circle, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
                }
                
                .core-shadow {
                    box-shadow: 0 0 60px rgba(59, 130, 246, 0.8), inset 0 0 30px rgba(139, 92, 246, 0.6);
                }
                
                .text-glow-cyan {
                    text-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
                }
                
                .animate-spin-slow {
                    animation: spin 4s linear infinite;
                }
                
                .animate-spin-reverse {
                    animation: spin 3s linear infinite reverse;
                }
                
                .animate-pulse-ring {
                    animation: pulse-ring 2s ease-in-out infinite;
                }
                
                .animate-core-glow {
                    animation: core-glow 3s ease-in-out infinite;
                }
                
                .animate-icon-float {
                    animation: icon-float 2s ease-in-out infinite;
                }
                
                .animate-text-glow {
                    animation: text-glow 2s ease-in-out infinite;
                }
                
                .animate-quantum-bounce {
                    animation: quantum-bounce 1.5s ease-in-out infinite;
                }
                
                .animate-ping-slow {
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                
                .animate-ping-medium {
                    animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                
                .animate-ping-fast {
                    animation: ping 4s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                
                .animate-float-slow {
                    animation: float 4s ease-in-out infinite;
                }
                
                .animate-float-medium {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-float-fast {
                    animation: float 2s ease-in-out infinite;
                }
                
                .animate-sweep {
                    animation: sweep 2s ease-in-out;
                }
                
                .animate-fade-in {
                    animation: fade-in 1s ease-in-out;
                }
                
                .animate-delay-200 { animation-delay: 0.2s; }
                .animate-delay-300 { animation-delay: 0.3s; }
                .animate-delay-400 { animation-delay: 0.4s; }
                .animate-delay-500 { animation-delay: 0.5s; }
                .animate-delay-600 { animation-delay: 0.6s; }
                .animate-delay-1000 { animation-delay: 1s; }
                
                @keyframes pulse-ring {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                
                @keyframes core-glow {
                    0%, 100% { 
                        box-shadow: 0 0 60px rgba(59, 130, 246, 0.8), inset 0 0 30px rgba(139, 92, 246, 0.6);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 80px rgba(139, 92, 246, 1), inset 0 0 40px rgba(236, 72, 153, 0.8);
                        transform: scale(1.05);
                    }
                }
                
                @keyframes icon-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                
                @keyframes text-glow {
                    0%, 100% { 
                        filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.8));
                    }
                    50% { 
                        filter: drop-shadow(0 0 20px rgba(139, 92, 246, 1));
                    }
                }
                
                @keyframes quantum-bounce {
                    0%, 100% { 
                        transform: translateY(0px) scale(1);
                        box-shadow: 0 0 10px currentColor;
                    }
                    50% { 
                        transform: translateY(-10px) scale(1.2);
                        box-shadow: 0 0 20px currentColor;
                    }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-10px) rotate(120deg); }
                    66% { transform: translateY(5px) rotate(240deg); }
                }
                
                @keyframes sweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}