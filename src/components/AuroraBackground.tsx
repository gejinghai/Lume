import React, { useEffect, useRef, useState } from 'react';
import { resolveImage, resolveCustomImage } from '../lib/assetResolver';

/**
 * AuroraBackground 极光背景组件
 * 使用 WebGL 着色器渲染动态极光效果
 * 支持自定义极光数量
 */

// 顶点着色器 - 处理顶点位置
const vertexShaderSource = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

// 片元着色器 - 渲染极光效果
const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec3 iResolution;    // 画布分辨率
uniform float iTime;         // 时间（用于动画）
uniform float iAuroraCount;  // 极光数量

out vec4 fragColor;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    vec3 col = vec3(0.0);
    float t = iTime * 0.3;

    // Create aurora ribbons
    for (float i = 1.0; i <= 10.0; i++) {
        if (i > iAuroraCount + 0.5) break;
        
        vec2 q = p;
        q.y += 0.1; // Shift down slightly
        q.x += t * 0.1 * i;
        
        // Wavy distortion
        q.y += sin(q.x * 1.5 + t) * 0.3;
        q.y += sin(q.x * 2.5 - t * 0.8) * 0.15;
        
        float d = abs(q.y);
        // Glow intensity
        float intensity = 0.015 / (d + 0.02);
        
        // Color gradient (Green to Purple/Blue)
        vec3 c = mix(vec3(0.1, 1.0, 0.5), vec3(0.4, 0.1, 0.9), i / 5.0);
        
        // Add vertical streaks
        float streaks = sin(q.x * 30.0 + t * 3.0) * 0.5 + 0.5;
        streaks *= sin(q.x * 15.0 - t * 1.5) * 0.5 + 0.5;
        
        col += c * intensity * (0.4 + 0.6 * streaks) * 0.7;
    }

    // Fade out at bottom and top
    col *= smoothstep(-0.8, 0.2, uv.y) * smoothstep(1.0, 0.4, uv.y);

    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;

interface AuroraBackgroundProps {
  auroraCount?: number;
  customVersion?: number;
}

export default function AuroraBackground({
  auroraCount = 5,
  customVersion = 0,
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef(auroraCount);
  const [bgSrc, setBgSrc] = useState(resolveImage('aurora'));

  // 异步加载自定义背景图片
  useEffect(() => {
    resolveCustomImage('aurora').then(dataUrl => {
      if (dataUrl) setBgSrc(dataUrl);
      else setBgSrc(resolveImage('aurora'));
    });
  }, [customVersion]);

  useEffect(() => {
    countRef.current = auroraCount;
  }, [auroraCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iAuroraCountLocation = gl.getUniformLocation(program, 'iAuroraCount');

    let animationFrameId: number;
    const startTime = performance.now();
    
    // 帧率控制：目标 30fps，每帧间隔约 33ms
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    let lastRenderTime = 0;

    const render = (time: number) => {
      // 帧率控制：跳过太短的帧
      const elapsed = time - lastRenderTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = time - (elapsed % frameInterval);
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.uniform3f(iResolutionLocation, canvas.width, canvas.height, 1.0);
      gl.uniform1f(iTimeLocation, (time - startTime) / 1000.0);
      gl.uniform1f(iAuroraCountLocation, countRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-surface">
      <img
        src={bgSrc}
        alt="Aurora background"
        className="absolute inset-0 w-full h-full object-cover scale-105 opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface/60 to-surface/90"></div>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full mix-blend-screen opacity-90" 
      />
    </div>
  );
}
