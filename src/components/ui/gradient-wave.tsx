"use client";
import { useEffect, useRef } from "react";

/* ──────────────────────────────────────────────
   MiniGl — tiny WebGL helper
────────────────────────────────────────────── */

function normalizeColor(hexCode: number): number[] {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ];
}

class MiniGl {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  meshes: any[] = [];
  commonUniforms: any;
  width?: number;
  height?: number;
  Material: any;
  Uniform: any;
  PlaneGeometry: any;
  Mesh: any;
  Attribute: any;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;
    const context = gl;
    const _miniGl = this;

    this.Uniform = class {
      type = "float";
      value: any;
      typeFn!: string;
      excludeFrom?: string;
      transpose?: boolean;

      constructor(e: any) {
        Object.assign(this, e);
        const m: Record<string, string> = {
          float: "1f", int: "1i", vec2: "2fv", vec3: "3fv",
          vec4: "4fv", mat4: "Matrix4fv",
        };
        this.typeFn = m[this.type] || "1f";
      }

      update(location: any) {
        if (this.value === undefined || location === null) return;
        const isMatrix = this.typeFn.indexOf("Matrix") === 0;
        const fn = `uniform${this.typeFn}`;
        if (isMatrix) (context as any)[fn](location, this.transpose || false, this.value);
        else (context as any)[fn](location, this.value);
      }

      getDeclaration(name: string, type: string, length?: number): string {
        if (this.excludeFrom === type) return "";
        if (this.type === "array") {
          return (
            this.value[0].getDeclaration(name, type, this.value.length) +
            `\nconst int ${name}_length = ${this.value.length};`
          );
        }
        if (this.type === "struct") {
          let n = name.replace("u_", "");
          n = n.charAt(0).toUpperCase() + n.slice(1);
          const fields = Object.entries(this.value)
            .map(([k, u]: [string, any]) => u.getDeclaration(k, type).replace(/^uniform/, ""))
            .join("");
          return `uniform struct ${n} {\n${fields}\n} ${name}${length ? `[${length}]` : ""};`;
        }
        return `uniform ${this.type} ${name}${length ? `[${length}]` : ""};`;
      }
    };

    this.Attribute = class {
      type: number = context.FLOAT;
      normalized = false;
      buffer: WebGLBuffer;
      target!: number;
      size!: number;
      values?: Float32Array | Uint16Array;

      constructor(e: any) {
        this.buffer = context.createBuffer()!;
        Object.assign(this, e);
      }

      update() {
        if (this.values) {
          context.bindBuffer(this.target, this.buffer);
          context.bufferData(this.target, this.values, context.STATIC_DRAW);
        }
      }

      attach(e: string, t: WebGLProgram) {
        const n = context.getAttribLocation(t, e);
        if (this.target === context.ARRAY_BUFFER) {
          context.bindBuffer(this.target, this.buffer);
          context.enableVertexAttribArray(n);
          context.vertexAttribPointer(n, this.size, this.type, this.normalized, 0, 0);
        }
        return n;
      }

      use(e: number) {
        context.bindBuffer(this.target, this.buffer);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(e);
          context.vertexAttribPointer(e, this.size, this.type, this.normalized, 0, 0);
        }
      }
    };

    this.Material = class {
      uniforms: any;
      uniformInstances: any[] = [];
      program!: WebGLProgram;

      constructor(vertexShaders: string, fragments: string, uniforms: any = {}) {
        const mat = this;

        function getShader(type: number, source: string) {
          const shader = context.createShader(type)!;
          context.shaderSource(shader, source);
          context.compileShader(shader);
          if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            throw new Error(context.getShaderInfoLog(shader) || "Shader error");
          }
          return shader;
        }

        function decls(u: any, t: string) {
          return Object.entries(u)
            .map(([n, v]: [string, any]) => v.getDeclaration(n, t))
            .join("\n");
        }

        mat.uniforms = uniforms;
        const prefix = "precision highp float;";

        const vSrc = `${prefix}\nattribute vec4 position;\nattribute vec2 uv;\nattribute vec2 uvNorm;\n${decls(_miniGl.commonUniforms, "vertex")}\n${decls(uniforms, "vertex")}\n${vertexShaders}`;
        const fSrc = `${prefix}\n${decls(_miniGl.commonUniforms, "fragment")}\n${decls(uniforms, "fragment")}\n${fragments}`;

        mat.program = context.createProgram()!;
        context.attachShader(mat.program, getShader(context.VERTEX_SHADER, vSrc));
        context.attachShader(mat.program, getShader(context.FRAGMENT_SHADER, fSrc));
        context.linkProgram(mat.program);

        if (!context.getProgramParameter(mat.program, context.LINK_STATUS)) {
          throw new Error(context.getProgramInfoLog(mat.program) || "Link error");
        }

        context.useProgram(mat.program);
        mat.attachUniforms(undefined, _miniGl.commonUniforms);
        mat.attachUniforms(undefined, mat.uniforms);
      }

      attachUniforms(name: string | undefined, uniforms: any) {
        if (name === undefined) {
          Object.entries(uniforms).forEach(([n, u]) => this.attachUniforms(n, u));
        } else if (uniforms.type === "array") {
          uniforms.value.forEach((u: any, i: number) => this.attachUniforms(`${name}[${i}]`, u));
        } else if (uniforms.type === "struct") {
          Object.entries(uniforms.value).forEach(([u, i]) => this.attachUniforms(`${name}.${u}`, i));
        } else {
          this.uniformInstances.push({
            uniform: uniforms,
            location: context.getUniformLocation(this.program, name),
          });
        }
      }
    };

    this.PlaneGeometry = class {
      width = 1; height = 1;
      attributes: any;
      vertexCount = 0;
      xSegCount = 0; ySegCount = 0;

      constructor() {
        this.attributes = {
          position: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 3 }),
          uv:       new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
          uvNorm:   new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
          index:    new _miniGl.Attribute({ target: context.ELEMENT_ARRAY_BUFFER, size: 3, type: context.UNSIGNED_SHORT }),
        };
      }

      setTopology(xSegs = 1, ySegs = 1) {
        this.xSegCount = xSegs; this.ySegCount = ySegs;
        this.vertexCount = (xSegs + 1) * (ySegs + 1);
        const quadCount = xSegs * ySegs * 2;
        this.attributes.uv.values     = new Float32Array(2 * this.vertexCount);
        this.attributes.uvNorm.values = new Float32Array(2 * this.vertexCount);
        this.attributes.index.values  = new Uint16Array(3 * quadCount);
        for (let y = 0; y <= ySegs; y++) {
          for (let x = 0; x <= xSegs; x++) {
            const i = y * (xSegs + 1) + x;
            this.attributes.uv.values[2*i]     = x / xSegs;
            this.attributes.uv.values[2*i + 1] = 1 - y / ySegs;
            this.attributes.uvNorm.values[2*i]     = (x / xSegs) * 2 - 1;
            this.attributes.uvNorm.values[2*i + 1] = 1 - (y / ySegs) * 2;
            if (x < xSegs && y < ySegs) {
              const s = y * xSegs + x;
              this.attributes.index.values[6*s]     = i;
              this.attributes.index.values[6*s + 1] = i + 1 + xSegs;
              this.attributes.index.values[6*s + 2] = i + 1;
              this.attributes.index.values[6*s + 3] = i + 1;
              this.attributes.index.values[6*s + 4] = i + 1 + xSegs;
              this.attributes.index.values[6*s + 5] = i + 2 + xSegs;
            }
          }
        }
        this.attributes.uv.update();
        this.attributes.uvNorm.update();
        this.attributes.index.update();
      }

      setSize(width = 1, height = 1) {
        this.width = width; this.height = height;
        this.attributes.position.values = new Float32Array(3 * this.vertexCount);
        const ox = width / -2, oy = height / -2;
        const sw = width / this.xSegCount, sh = height / this.ySegCount;
        for (let y = 0; y <= this.ySegCount; y++) {
          const py = oy + y * sh;
          for (let x = 0; x <= this.xSegCount; x++) {
            const px = ox + x * sw;
            const idx = y * (this.xSegCount + 1) + x;
            this.attributes.position.values[3*idx]     = px;
            this.attributes.position.values[3*idx + 1] = -py;
            this.attributes.position.values[3*idx + 2] = 0;
          }
        }
        this.attributes.position.update();
      }
    };

    this.Mesh = class {
      geometry: any; material: any;
      attributeInstances: any[] = [];

      constructor(geometry: any, material: any) {
        this.geometry = geometry; this.material = material;
        Object.entries(geometry.attributes).forEach(([e, attr]: [string, any]) => {
          this.attributeInstances.push({ attribute: attr, location: attr.attach(e, material.program) });
        });
        _miniGl.meshes.push(this);
      }

      draw() {
        context.useProgram(this.material.program);
        this.material.uniformInstances.forEach(({ uniform, location }: any) => uniform.update(location));
        this.attributeInstances.forEach(({ attribute, location }: any) => attribute.use(location));
        context.drawElements(context.TRIANGLES, this.geometry.attributes.index.values.length, context.UNSIGNED_SHORT, 0);
      }
    };

    const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    this.commonUniforms = {
      projectionMatrix: new this.Uniform({ type: "mat4", value: I }),
      modelViewMatrix:  new this.Uniform({ type: "mat4", value: I }),
      resolution:   new this.Uniform({ type: "vec2",  value: [1,1] }),
      aspectRatio:  new this.Uniform({ type: "float", value: 1    }),
    };
  }

  setSize(w = 640, h = 480) {
    this.width = w; this.height = h;
    this.canvas.width = w; this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.commonUniforms.resolution.value = [w, h];
    this.commonUniforms.aspectRatio.value = w / h;
  }

  setOrthographicCamera() {
    this.commonUniforms.projectionMatrix.value = [
      2/this.width!, 0, 0, 0,
      0, 2/this.height!, 0, 0,
      0, 0, -0.001, 0,
      0, 0, 0, 1,
    ];
  }

  render() {
    this.gl.clearColor(0,0,0,0);
    this.gl.clearDepth(1);
    this.meshes.forEach(m => m.draw());
  }
}

/* ──────────────────────────────────────────────
   Gradient orchestrator
────────────────────────────────────────────── */

class Gradient {
  canvas: HTMLCanvasElement;
  colors: string[];
  minigl: MiniGl;
  mesh: any;
  time = 0; last = 0;
  animationId?: number;
  isPlaying = false;

  constructor(canvas: HTMLCanvasElement, colors: string[]) {
    this.canvas = canvas;
    this.colors = colors;
    this.minigl = new MiniGl(canvas);
    this.init();
  }

  init() {
    const sectionColors = this.colors.map(hex =>
      normalizeColor(parseInt(hex.replace("#", "0x"), 16))
    );

    const U = (v: any) => new this.minigl.Uniform(v);

    const uniforms: any = {
      u_time:          U({ value: 0 }),
      u_shadow_power:  U({ value: 5 }),
      u_darken_top:    U({ value: 0 }),
      u_active_colors: U({ value: [1,1,1,1], type: "vec4" }),
      u_global: U({
        value: {
          noiseFreq:  U({ value: [0.00014, 0.00029], type: "vec2" }),
          noiseSpeed: U({ value: 0.000005 }),
        },
        type: "struct",
      }),
      u_vertDeform: U({
        value: {
          incline:      U({ value: 0 }),
          offsetTop:    U({ value: -0.5 }),
          offsetBottom: U({ value: -0.5 }),
          noiseFreq:    U({ value: [3,4], type: "vec2" }),
          noiseAmp:     U({ value: 320 }),
          noiseSpeed:   U({ value: 10 }),
          noiseFlow:    U({ value: 3 }),
          noiseSeed:    U({ value: 5 }),
        },
        type: "struct",
        excludeFrom: "fragment",
      }),
      u_baseColor: U({ value: sectionColors[0], type: "vec3", excludeFrom: "fragment" }),
      u_waveLayers: U({ value: [], excludeFrom: "fragment", type: "array" }),
    };

    for (let i = 1; i < sectionColors.length; i++) {
      uniforms.u_waveLayers.value.push(U({
        value: {
          color:      U({ value: sectionColors[i], type: "vec3" }),
          noiseFreq:  U({ value: [2 + i/sectionColors.length, 3 + i/sectionColors.length], type: "vec2" }),
          noiseSpeed: U({ value: 11 + 0.3*i }),
          noiseFlow:  U({ value: 6.5 + 0.3*i }),
          noiseSeed:  U({ value: 5 + 10*i }),
          noiseFloor: U({ value: 0.1 }),
          noiseCeil:  U({ value: 0.63 + 0.07*i }),
        },
        type: "struct",
      }));
    }

    const vertexShader = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 blendNormal(vec3 base,vec3 blend){return blend;}
vec3 blendNormal(vec3 base,vec3 blend,float opacity){return(blend*opacity+base*(1.-opacity));}
varying vec3 v_color;
void main(){
  float time=u_time*u_global.noiseSpeed;
  vec2 noiseCoord=resolution*uvNorm*u_global.noiseFreq;
  float tilt=resolution.y/2.*uvNorm.y;
  float incline=resolution.x*uvNorm.x/2.*u_vertDeform.incline;
  float offset=resolution.x/2.*u_vertDeform.incline*mix(u_vertDeform.offsetBottom,u_vertDeform.offsetTop,uv.y);
  float noise=snoise(vec3(noiseCoord.x*u_vertDeform.noiseFreq.x+time*u_vertDeform.noiseFlow,noiseCoord.y*u_vertDeform.noiseFreq.y,time*u_vertDeform.noiseSpeed+u_vertDeform.noiseSeed))*u_vertDeform.noiseAmp;
  noise*=1.-pow(abs(uvNorm.y),2.);
  noise=max(0.,noise);
  vec3 pos=vec3(position.x,position.y+tilt+incline+noise-offset,position.z);
  v_color=u_baseColor;
  for(int i=0;i<u_waveLayers_length;i++){
    if(u_active_colors[i]==1.){
      WaveLayers layer=u_waveLayers[i];
      float layerNoise=smoothstep(layer.noiseFloor,layer.noiseCeil,snoise(vec3(noiseCoord.x*layer.noiseFreq.x+time*layer.noiseFlow,noiseCoord.y*layer.noiseFreq.y,time*layer.noiseSpeed+layer.noiseSeed))/2.+.5);
      v_color=blendNormal(v_color,layer.color,pow(layerNoise,4.));
    }
  }
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
}`;

    const fragmentShader = `
varying vec3 v_color;
void main(){
  vec3 color=v_color;
  if(u_darken_top==1.){
    vec2 st=gl_FragCoord.xy/resolution.xy;
    color.g-=pow(st.y+sin(-12.)*st.x,u_shadow_power)*.4;
  }
  gl_FragColor=vec4(color,1.);
}`;

    const material = new this.minigl.Material(vertexShader, fragmentShader, uniforms);
    const geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(geometry, material);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.minigl.setSize(w, h);
    this.minigl.setOrthographicCamera();
    this.mesh.geometry.setTopology(Math.ceil(w * 0.02), Math.ceil(h * 0.05));
    this.mesh.geometry.setSize(w, h);
    this.mesh.material.uniforms.u_shadow_power.value = w < 600 ? 5 : 6;
  }

  animate = (ts: number) => {
    if (!this.isPlaying) return;
    if (!this.last) this.last = ts;
    const delta = ts - this.last;
    this.time += Math.min(delta, 1000 / 15);
    this.last = ts;
    this.mesh.material.uniforms.u_time.value = this.time * 0.01; // Scale time for better speed control
    this.minigl.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

  start() { 
    this.isPlaying = true; 
    this.last = 0; // Reset last to force initialization in next animate frame
    this.animationId = requestAnimationFrame(this.animate); 
  }
  stop()  { this.isPlaying = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

/* ──────────────────────────────────────────────
   Public React component
────────────────────────────────────────────── */

export interface GradientWaveProps {
  colors?: string[];
  isPlaying?: boolean;
  className?: string;
  shadowPower?: number;
  darkenTop?: boolean;
  noiseSpeed?: number;
  noiseFrequency?: [number, number];
  deform?: {
    incline?: number;
    offsetTop?: number;
    offsetBottom?: number;
    noiseFreq?: [number, number];
    noiseAmp?: number;
    noiseSpeed?: number;
    noiseFlow?: number;
    noiseSeed?: number;
  };
}

export function GradientWave({
  colors = ["#bae6fd", "#e0f2fe", "#7dd3fc", "#38bdf8", "#f0f9ff"],
  isPlaying = true,
  className = "",
  shadowPower = 5,
  darkenTop = false,
  noiseSpeed = 0.00001,
  noiseFrequency = [0.0001, 0.0003],
  deform = { incline: 0.3, noiseAmp: 200, noiseFlow: 3 },
}: GradientWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef  = useRef<Gradient | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute", top: "0", left: "0",
      width: "100%", height: "100%", display: "block",
    });
    containerRef.current.appendChild(canvas);

    try {
      const g = new Gradient(canvas, colors);
      gradientRef.current = g;
      g.mesh.material.uniforms.u_shadow_power.value = shadowPower;
      g.mesh.material.uniforms.u_darken_top.value   = darkenTop ? 1 : 0;
      g.mesh.material.uniforms.u_global.value.noiseFreq.value  = noiseFrequency;
      g.mesh.material.uniforms.u_global.value.noiseSpeed.value = noiseSpeed;
      
      if (deform) {
        Object.entries(deform).forEach(([k, v]) => {
          const u = g.mesh.material.uniforms.u_vertDeform.value[k];
          if (u) u.value = v;
        });
      }

      if (isPlaying) g.start();
    } catch (e) {
      console.error("GradientWave init failed:", e);
    }

    return () => {
      gradientRef.current?.stop();
      if (containerRef.current?.contains(canvas)) {
        containerRef.current.removeChild(canvas);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(colors), isPlaying, shadowPower, darkenTop, noiseSpeed, JSON.stringify(noiseFrequency), JSON.stringify(deform)]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-0 w-full h-full overflow-hidden ${className}`}
    />
  );
}