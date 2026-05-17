import React, { useEffect, useRef, useState } from 'react';
import { useGaplessAudio } from '../lib/useGaplessAudio';
import { resolveSound, resolveImage, resolveCustomImage } from '../lib/assetResolver';

/**
 * SnowBackground 雪花背景组件
 * 使用 WebGL 着色器渲染动态雪花效果
 * 包含雪花飘落、堆积等视觉效果
 */

// 顶点着色器
const vertexShaderSource = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

// 片元着色器
const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform float iIntensity;

out vec4 fragColor;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float snow = 0.0;
    float gradient = (1.0-float(fragCoord.y / iResolution.x))*0.4;
    float random = fract(sin(dot(fragCoord.xy,vec2(12.9898,78.233)))* 43758.5453);
    
    // Use iIntensity to control snow density
    float threshold = 0.08 * (0.2 + iIntensity * 1.8);

    for(int k=0;k<6;k++){
        for(int i=0;i<12;i++){
            float cellSize = 2.0 + (float(i)*3.0);
			float downSpeed = 0.3+(sin(iTime*0.4+float(k+i*20))+1.0)*0.00008;
            vec2 uv = (fragCoord.xy / iResolution.x)+vec2(0.01*sin((iTime+float(k*6185))*0.6+float(i))*(5.0/float(i)),downSpeed*(iTime+float(k*1352))*(1.0/float(i)));
            vec2 uvStep = (ceil((uv)*cellSize-vec2(0.5,0.5))/cellSize);
            float x = fract(sin(dot(uvStep.xy,vec2(12.9898+float(k)*12.0,78.233+float(k)*315.156)))* 43758.5453+float(k)*12.0)-0.5;
            float y = fract(sin(dot(uvStep.xy,vec2(62.2364+float(k)*23.0,94.674+float(k)*95.0)))* 62159.8432+float(k)*12.0)-0.5;

            float randomMagnitude1 = sin(iTime*2.5)*0.7/cellSize;
            float randomMagnitude2 = cos(iTime*2.5)*0.7/cellSize;

            float d = 5.0*distance((uvStep.xy + vec2(x*sin(y),y)*randomMagnitude1 + vec2(y,x)*randomMagnitude2),uv.xy);

            float omiVal = fract(sin(dot(uvStep.xy,vec2(32.4691,94.615)))* 31572.1684);
            if(omiVal<threshold){
                float newd = (x+1.0)*0.4*clamp(1.9-d*(15.0+(x*6.3))*(cellSize/1.4),0.0,1.0);
                snow += newd;
            }
        }
    }
    
    fragColor = vec4(snow)+gradient*vec4(0.4,0.8,1.0,0.0) + random*0.01;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;

interface SnowBackgroundProps {
  intensity?: number;
  volume?: number;
  whiteNoiseEnabled?: boolean;
  customVersion?: number;
}

export default function SnowBackground({
  intensity = 0.5,
  volume = 0.5,
  whiteNoiseEnabled = true,
  customVersion = 0,
}: SnowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgSrc, setBgSrc] = useState(resolveImage('winter'));

  // 异步加载自定义背景图片
  useEffect(() => {
    resolveCustomImage('winter').then(dataUrl => {
      if (dataUrl) setBgSrc(dataUrl);
      else setBgSrc(resolveImage('winter'));
    });
  }, [customVersion]);

  // 使用 Web Audio API 实现无缝循环（支持自定义资源路径）
  useGaplessAudio(resolveSound('wind'), volume, whiteNoiseEnabled);

  // Handle WebGL Shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    // Compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fragmentShader));
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Setup geometry
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

    // Uniforms
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iIntensityLocation = gl.getUniformLocation(program, 'iIntensity');

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
      // Resize canvas if needed
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.uniform3f(iResolutionLocation, canvas.width, canvas.height, 1.0);
      gl.uniform1f(iTimeLocation, (time - startTime) / 1000.0);
      gl.uniform1f(iIntensityLocation, intensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, customVersion]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-surface">
      <img
        src={bgSrc}
        alt="Snowy mountain background"
        className="absolute inset-0 w-full h-full object-cover scale-105 opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 to-surface/90"></div>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full mix-blend-screen opacity-80" 
      />
    </div>
  );
}
