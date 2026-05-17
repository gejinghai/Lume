import React, { useEffect, useRef } from 'react';
import { useGaplessAudio } from '../lib/useGaplessAudio';

/**
 * StarsBackgroundProps 接口
 */
interface StarsBackgroundProps {
  volume?: number;           // 音量大小 (0-1)
  starDensity?: number;       // 星星密度
  whiteNoiseEnabled?: boolean;  // 白噪音开关
}

/**
 * StarsBackground 星空背景组件
 * 使用 Canvas 2D 渲染静态星空
 * 支持流星效果和环境白噪音
 */
export default function StarsBackground({ 
  volume = 0.5, 
  starDensity = 400, 
  whiteNoiseEnabled = true 
}: StarsBackgroundProps) {
  // Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 使用 Web Audio API 实现无缝循环（解决 <audio loop> 的 1-2s gap）
  useGaplessAudio('./sounds/nightsound.mp3', volume * 0.6, whiteNoiseEnabled);
  useGaplessAudio('./sounds/cricket.mp3', volume * 0.4, whiteNoiseEnabled);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    class Star {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      twinkleSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 1.5 + 0.1;
        this.opacity = Math.random();
        this.twinkleSpeed = (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
      }

      update() {
        this.opacity += this.twinkleSpeed;
        if (this.opacity >= 1) {
          this.opacity = 1;
          this.twinkleSpeed *= -1;
        } else if (this.opacity <= 0.1) {
          this.opacity = 0.1;
          this.twinkleSpeed *= -1;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    class ShootingStar {
      x: number = 0;
      y: number = 0;
      length: number = 0;
      speed: number = 0;
      angle: number = 0;
      opacity: number = 0;
      active: boolean = false;
      delay: number = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height * 0.5 - height * 0.2;
        this.length = Math.random() * 80 + 40;
        this.speed = Math.random() * 10 + 15;
        this.angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
        this.opacity = 0;
        this.active = false;
        this.delay = Math.random() * 200 + 50;
      }

      update() {
        if (!this.active) {
          this.delay--;
          if (this.delay <= 0) {
            this.active = true;
            this.opacity = 1;
          }
          return;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.opacity -= 0.015;

        if (this.opacity <= 0 || this.x > width || this.y > height) {
          this.reset();
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;

        const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    let stars = Array.from({ length: starDensity }, () => new Star());
    const shootingStars = Array.from({ length: 4 }, () => new ShootingStar());
    let animationFrameId: number;
    
    // 帧率控制：目标 30fps，每帧间隔约 33ms
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    let lastRenderTime = 0;

    const render = () => {
      // 帧率控制：跳过太短的帧
      const now = performance.now();
      const elapsed = now - lastRenderTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now - (elapsed % frameInterval);
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw background stars
      stars.forEach(star => {
        star.update();
        star.draw(ctx);
      });

      // Draw shooting stars
      ctx.lineCap = 'round';
      shootingStars.forEach(star => {
        star.update();
        star.draw(ctx);
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starDensity]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-100 mix-blend-screen" />
    </div>
  );
}
