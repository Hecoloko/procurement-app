import React from 'react';
import { ProcureProLogoIcon } from './Icons';

interface LoadingScreenProps {
    progress: number;
    status?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, status = "Loading Company Database..." }) => {
    // Calculate stroke dasharray for the gauge (circle)
    // Radius 40, circumference = 2 * pi * 40 ≈ 251.3
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-500">
            <div className="relative flex flex-col items-center">
                {/* Logo or Icon in the center */}
                <div className="mb-8 animate-pulse">
                    <ProcureProLogoIcon className="w-16 h-16 text-primary" />
                </div>

                {/* Gauge / Progress Circle */}
                <div className="relative w-32 h-32 mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="text-primary transition-all duration-500 ease-out"
                        />
                    </svg>

                    {/* Percentage Text in Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold font-mono">{Math.round(progress)}%</span>
                    </div>
                </div>

                {/* Status Text */}
                <div className="flex flex-col items-center space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">{status}</h2>
                    <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                        {progress < 30 && "Initializing connection..."}
                        {progress >= 30 && progress < 70 && "Fetching secure data..."}
                        {progress >= 70 && progress < 100 && "Finalizing setup..."}
                        {progress === 100 && "Ready"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
