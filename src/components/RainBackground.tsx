import React, { useEffect, useRef } from 'react';
import { useGaplessAudio } from '../lib/useGaplessAudio';
import { resolveSound, resolveImage, resolveCustomImage } from '../lib/assetResolver';

/**
 * RainBackground 雨滴背景组件
 * 使用 WebGL 着色器渲染动态雨滴效果
 * 包含雨滴下落、水面波纹等视觉效果
 */

// 顶点着色器 - 处理顶点位置
const vertexShaderSource = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

// 片元着色器 - 渲染雨滴效果
const fragmentShaderSource = `#version 300 es
precision highp float;

// 着色器 uniform 变量
uniform vec3 iResolution;    // 画布分辨率
uniform float iTime;         // 时间（用于动画）
uniform vec4 iMouse;         // 鼠标位置
uniform sampler2D iChannel0; // 纹理通道

out vec4 fragColor;

// 平滑过渡函数
#define S(a, b, t) smoothstep(a, b, t)
//#define CHEAP_NORMALS
//#define HAS_HEART // Commented out to prevent the heart drawing and allow full rain effect
#define USE_POST_PROCESSING

vec3 N13(float p) {
   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
   p3 += dot(p3, p3.yzx + 19.19);
   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

vec4 N14(float t) {
	return fract(sin(t*vec4(123., 1024., 1456., 264.))*vec4(6547., 345., 8799., 1564.));
}
float N(float t) {
    return fract(sin(t*12345.564)*7658.76);
}

float Saw(float b, float t) {
	return S(0., b, t)*S(1., b, t);
}

vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;
    
    uv.y += t*0.75;
    vec2 a = vec2(6., 1.);
    vec2 grid = a*2.;
    vec2 id = floor(uv*grid);
    
    float colShift = N(id.x); 
    uv.y += colShift;
    
    id = floor(uv*grid);
    vec3 n = N13(id.x*35.2+id.y*2376.1);
    vec2 st = fract(uv*grid)-vec2(.5, 0.0);
    
    float x = n.x-.5;
    
    float y = UV.y*20.;
    float wiggle = sin(y+sin(y));
    x += wiggle*(.5-abs(x))*(n.z-.5);
    x *= .7;
    float ti = fract(t+n.z);
    y = (Saw(.85, ti)-.5)*.9+.5;
    vec2 p = vec2(x, y);
    
    float d = length((st-p)*a.yx);
    
    float mainDrop = S(.4, .0, d);
    
    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x-x);
    float trail = S(.23*r, .15*r*r, cd);
    float trailFront = S(-.02, .02, st.y-y);
    trail *= trailFront*r*r;
    
    y = UV.y;
    float trail2 = S(.2*r, .0, cd);
    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
    y = fract(y*10.)+(st.y-.5);
    float dd = length(st-vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop+droplets*r*trailFront;
    
    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
	uv *= 40.;
    
    vec2 id = floor(uv);
    uv = fract(uv)-.5;
    vec3 n = N13(id.x*107.45+id.y*3543.654);
    vec2 p = (n.xy-.5)*.7;
    float d = length(uv-p);
    
    float fade = Saw(.025, fract(t+n.z));
    float c = S(.3, 0., d)*fract(n.z*10.)*fade;
    return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
    float s = StaticDrops(uv, t)*l0; 
    vec2 m1 = DropLayer2(uv, t)*l1;
    vec2 m2 = DropLayer2(uv*1.85, t)*l2;
    
    float c = s+m1.x+m2.x;
    c = S(.3, 1., c);
    
    return vec2(c, max(m1.y*l0, m2.y*l1));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy-.5*iResolution.xy) / iResolution.y;
    vec2 UV = fragCoord.xy/iResolution.xy;
    vec3 M = iMouse.xyz/iResolution.xyz;
    float T = iTime+M.x*2.;
    
    #ifdef HAS_HEART
    T = mod(iTime, 102.);
    T = mix(T, M.x*102., M.z>0.?1.:0.);
    #endif
    
    float t = T*.2;
    
    float rainAmount = iMouse.z>0. ? M.y : sin(T*.05)*.3+.7;
    
    float maxBlur = mix(3., 6., rainAmount);
    float minBlur = 2.;
    
    float story = 0.;
    float heart = 0.;
    
    #ifdef HAS_HEART
    story = S(0., 70., T);
    
    t = min(1., T/70.);
    t = 1.-t;
    t = (1.-t*t)*70.;
    
    float zoom= mix(.3, 1.2, story);
    uv *=zoom;
    minBlur = 4.+S(.5, 1., story)*3.;
    maxBlur = 6.+S(.5, 1., story)*1.5;
    
    vec2 hv = uv-vec2(.0, -.1);
    hv.x *= .5;
    float s = S(110., 70., T);
    hv.y-=sqrt(abs(hv.x))*.5*s;
    heart = length(hv);
    heart = S(.4*s, .2*s, heart)*s;
    rainAmount = heart;
    
    maxBlur-=heart;
    uv *= 1.5;
    t *= .25;
    #else
    float zoom = 0.0;
    uv *= 0.4; // Static drop scale, made smaller to make drops larger
    #endif
    // UV = UV; // Removed background zoom animation
    
    float staticDrops = S(-.5, 1., rainAmount)*2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);
    
    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
   #ifdef CHEAP_NORMALS
    	vec2 n = vec2(dFdx(c.x), dFdy(c.x));
    #else
    	vec2 e = vec2(.001, 0.);
    	float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
    	float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
    	vec2 n = vec2(cx-c.x, cy-c.x);
    #endif
    
    #ifdef HAS_HEART
    n *= 1.-S(60., 85., T);
    c.y *= 1.-S(80., 100., T)*.8;
    #endif
    
    float focus = mix(maxBlur-c.y, minBlur, S(.1, .2, c.x));
    vec3 col = textureLod(iChannel0, UV+n, focus).rgb;
    
    #ifdef USE_POST_PROCESSING
    t = (T+3.)*.5;
    float colFade = sin(t*.2)*.5+.5+story;
    col *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade);
    float fade = S(0., 10., T);
    float lightning = sin(t*sin(t*10.));
    lightning *= pow(max(0., sin(t+sin(t))), 10.);
    col *= 1.+lightning*fade*mix(1., .1, story*story);
    col *= 1.-dot(UV-=.5, UV);
    											
    #ifdef HAS_HEART
    	col = mix(pow(col, vec3(1.2)), col, heart);
    	fade *= S(102., 97., T);
    #endif
    
    col *= fade;
    #endif
    
    fragColor = vec4(col, 1.);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;

interface RainBackgroundProps {
  intensity?: number;
  volume?: number;
  thunderEnabled?: boolean;
  whiteNoiseEnabled?: boolean;
  customVersion?: number;
}

export default function RainBackground({
  intensity = 0.5,
  volume = 0.5,
  thunderEnabled = false,
  whiteNoiseEnabled = true,
  customVersion = 0,
}: RainBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 使用 Web Audio API 实现无缝循环（支持自定义资源路径）
  useGaplessAudio(resolveSound('rain'), volume, whiteNoiseEnabled);
  useGaplessAudio(resolveSound('thunder'), volume, thunderEnabled && whiteNoiseEnabled);

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
    
    // Inject thunderEnabled into shader if needed, or just let the shader do its default lightning
    // The original shader has lightning built-in. We can toggle it by modifying the shader source.
    let modifiedFragmentSource = fragmentShaderSource;
    if (!thunderEnabled) {
      // Disable lightning by replacing the lightning calculation
      modifiedFragmentSource = modifiedFragmentSource.replace(
        'float lightning = sin(t*sin(t*10.));',
        'float lightning = 0.0;'
      );
    }

    gl.shaderSource(fragmentShader, modifiedFragmentSource);
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
    const iMouseLocation = gl.getUniformLocation(program, 'iMouse');
    const iChannel0Location = gl.getUniformLocation(program, 'iChannel0');

    // Load texture — 先尝试自定义图片（data URL），否则使用内建路径
    const texture = gl.createTexture();
    const image = new Image();
    let textureLoaded = false;
    const loadTexture = async () => {
      try {
        let src = resolveImage('rain');
        const customDataUrl = await resolveCustomImage('rain');
        if (customDataUrl) src = customDataUrl;
        image.src = src;
      } catch (err) {
        console.error('[RainBackground] Failed to load texture src:', err);
      }
    };
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textureLoaded = true;
    };
    image.onerror = () => {
      console.error('[RainBackground] Failed to load texture:', image.src.substring(0, 100));
    };
    loadTexture();

    let mouseX = 0;
    let mouseY = intensity; // Use intensity prop to control rain amount
    let mouseZ = 1; // Force mouse down state to use M.y for rain amount
    let mouseW = 1;

    const handleMouseMove = (e: MouseEvent) => {
      // Only track X for time shift, keep Y fixed to intensity
      mouseX = e.clientX;
    };

    window.addEventListener('mousemove', handleMouseMove);

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
      // Update intensity dynamically
      // Multiply by canvas.height because the shader divides iMouse.y by iResolution.y
      mouseY = intensity * canvas.height;

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
      gl.uniform4f(iMouseLocation, mouseX, mouseY, mouseZ, mouseW);

      if (textureLoaded) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(iChannel0Location, 0);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
    };
  }, [intensity, thunderEnabled, customVersion]); // Re-compile shader if thunderEnabled changes

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 w-full h-full pointer-events-none"
      />
    </>
  );
}

