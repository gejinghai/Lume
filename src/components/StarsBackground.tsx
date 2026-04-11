import React, { useEffect, useRef } from 'react';

interface StarsBackgroundProps {
  volume?: number;
  starDensity?: number;
  whiteNoiseEnabled?: boolean;
}

export default function StarsBackground({ 
  volume = 0.5, 
  starDensity = 400, 
  whiteNoiseEnabled = true 
}: StarsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef1 = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);

  // Handle Audio
  useEffect(() => {
    if (audioRef1.current) {
      audioRef1.current.volume = volume * 0.6;
      if (whiteNoiseEnabled) {
        audioRef1.current.play().catch(e => console.log('Audio autoplay blocked:', e));
      } else {
        audioRef1.current.pause();
      }
    }
    if (audioRef2.current) {
      audioRef2.current.volume = volume * 0.4;
      if (whiteNoiseEnabled) {
        audioRef2.current.play().catch(e => console.log('Audio autoplay blocked:', e));
      } else {
        audioRef2.current.pause();
      }
    }
  }, [volume, whiteNoiseEnabled]);

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

    // Big Dipper (北斗七星) relative coordinates (0 to 1)
    const bigDipperCoords = [
      { x: 0.75, y: 0.20 }, // Dubhe
      { x: 0.82, y: 0.28 }, // Merak
      { x: 0.70, y: 0.35 }, // Phecda
      { x: 0.62, y: 0.30 }, // Megrez
      { x: 0.50, y: 0.33 }, // Alioth
      { x: 0.42, y: 0.38 }, // Mizar
      { x: 0.30, y: 0.45 }  // Alkaid
    ];

    let stars = Array.from({ length: starDensity }, () => new Star());
    const shootingStars = Array.from({ length: 4 }, () => new ShootingStar());
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw background stars
      stars.forEach(star => {
        star.update();
        star.draw(ctx);
      });

      // Draw Big Dipper
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      // Draw lines connecting Big Dipper
      ctx.beginPath();
      bigDipperCoords.forEach((coord, index) => {
        const px = coord.x * width;
        const py = coord.y * height;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      // Connect Megrez back to Dubhe to complete the bowl
      ctx.lineTo(bigDipperCoords[0].x * width, bigDipperCoords[0].y * height);
      ctx.stroke();

      // Draw the 7 stars of Big Dipper
      bigDipperCoords.forEach(coord => {
        const px = coord.x * width;
        const py = coord.y * height;
        // Glow
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();
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
      {/* Night Sounds */}
      <audio 
        ref={audioRef1} 
        src="./sounds/nightsound.mp3"
        loop 
      />
      <audio 
        ref={audioRef2} 
        src="./sounds/cricket.mp3"
        loop 
      />
    </div>
  );
}
