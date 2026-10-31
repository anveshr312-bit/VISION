"use client";
import React from "react";
import { ShootingStars } from "@/src/components/ui/shooting-stars";
import { StarsBackground } from "@/src/components/ui/stars-background";

export default function ShootingStarsAndStarsBackgroundDemo() {
  return (
    <div className="h-[40rem] rounded-md bg-[#111A19] flex flex-col items-center justify-center relative w-full overflow-hidden">
      <h2 className="relative flex-col md:flex-row z-10 text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium bg-clip-text text-transparent bg-gradient-to-b from-[#949C96] via-[#EAECE9] to-[#B8CE82] flex items-center gap-2 md:gap-8">
        <span>Shooting Star</span>
        <span className="text-[#B8CE82] text-lg font-thin">x</span>
        <span>Star Background</span>
      </h2>
      <ShootingStars starColor="#B8CE82" trailColor="#82A995" />
      <StarsBackground />
    </div>
  );
}
