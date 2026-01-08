import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, NgZone, PLATFORM_ID, Inject, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// 1. CAMBIO IMPORTANTE: Importamos solo lo necesario de Three.js
import { 
  Scene, 
  OrthographicCamera, 
  WebGLRenderer, 
  ShaderMaterial, 
  Vector2, 
  Color, 
  PlaneGeometry, 
  Mesh 
} from 'three';

import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-light-pillar',
  standalone: true,
  template: `<div #container class="light-pillar-container" [style.mix-blend-mode]="mixBlendMode"></div>
             @if (!webGLSupported) {
               <div class="light-pillar-fallback" [class]="className" [style.mix-blend-mode]="mixBlendMode">
                 WebGL not supported
               </div>
             }`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .light-pillar-container {
      width: 100%;
      height: 100%;
    }
    .light-pillar-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: white;
    }
  `]
})
export class LightPillarComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() topColor = '#5227FF';
  @Input() bottomColor = '#FF9FFC';
  @Input() intensity = 1.0;
  @Input() rotationSpeed = 0.3;
  @Input() interactive = false;
  @Input() className = '';
  @Input() glowAmount = 0.005;
  @Input() pillarWidth = 3.0;
  @Input() pillarHeight = 0.4;
  @Input() noiseIntensity = 0.5;
  @Input() mixBlendMode = 'screen';
  @Input() pillarRotation = 0;

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  public themeService = inject(ThemeService);

  webGLSupported = true;
  
  // 2. Quitamos el prefijo 'THREE.' en las definiciones de tipos
  private renderer: WebGLRenderer | null = null;
  private material: ShaderMaterial | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private geometry: PlaneGeometry | null = null;
  
  private rafId: number | null = null;
  private mouse = new Vector2(0, 0); // THREE.Vector2 -> Vector2
  private time = 0;
  private resizeObserver: ResizeObserver | null = null;
  private configurationTheme = 'blendMax(radialBound, fieldDistance, 1.0)';
  private isViewInitialized = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    effect(() => {
      const theme = this.themeService.theme();
      if (theme === 'dark') {
        this.configurationTheme = 'blendMax(radialBound, fieldDistance, 1.0)';
      } else {
        this.configurationTheme = 'blendMin(radialBound, fieldDistance, 1.0)';
      }

      if (this.isViewInitialized && this.webGLSupported && isPlatformBrowser(this.platformId)) {
        this.ngZone.runOutsideAngular(() => {
            this.cleanup();
            this.initThree();
        });
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        this.webGLSupported = false;
        console.warn('WebGL is not supported in this browser');
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.material) return;

    if (changes['topColor']) {
      this.material.uniforms['uTopColor'].value.set(this.topColor);
    }
    if (changes['bottomColor']) {
      this.material.uniforms['uBottomColor'].value.set(this.bottomColor);
    }
    if (changes['intensity']) {
      this.material.uniforms['uIntensity'].value = this.intensity;
    }
  }

  ngAfterViewInit() {
    this.isViewInitialized = true;
    if (!this.webGLSupported || !isPlatformBrowser(this.platformId)) return;

    this.initThree();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initThree() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 3. Quitamos el prefijo 'THREE.' en las instanciaciones
    this.scene = new Scene();
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    try {
      this.renderer = new WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        precision: 'lowp',
        stencil: false,
        depth: false
      });
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      this.webGLSupported = false;
      return;
    }

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform float uPillarRotation;
      varying vec2 vUv;

      const float PI = 3.141592653589793;
      const float EPSILON = 0.001;
      const float E = 2.71828182845904523536;
      const float HALF = 0.5;

      mat2 rot(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float noise(vec2 coord) {
        float G = E;
        vec2 r = (G * sin(G * coord));
        return fract(r.x * r.y * (1.0 + coord.x));
      }

      vec3 applyWaveDeformation(vec3 pos, float timeOffset) {
        float frequency = 1.0;
        float amplitude = 1.0;
        vec3 deformed = pos;
        
        for(float i = 0.0; i < 4.0; i++) {
          deformed.xz *= rot(0.4);
          float phase = timeOffset * i * 2.0;
          vec3 oscillation = cos(deformed.zxy * frequency - phase);
          deformed += oscillation * amplitude;
          frequency *= 2.0;
          amplitude *= HALF;
        }
        return deformed;
      }

      float blendMin(float a, float b, float k) {
        float scaledK = k * 4.0;
        float h = max(scaledK - abs(a - b), 0.0);
        return min(a, b) - h * h * 0.25 / scaledK;
      }

      float blendMax(float a, float b, float k) {
        return -blendMin(-a, -b, k);
      }

      void main() {
        vec2 fragCoord = vUv * uResolution;
        vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;
        
        float rotAngle = uPillarRotation * PI / 180.0;
        uv *= rot(rotAngle);

        vec3 origin = vec3(0.0, 0.0, -10.0);
        vec3 direction = normalize(vec3(uv, 1.0));

        float maxDepth = 50.0;
        float depth = 0.1;

        mat2 rotX = rot(uTime * 0.3);
        if(uInteractive && length(uMouse) > 0.0) {
          rotX = rot(uMouse.x * PI * 2.0);
        }

        vec3 color = vec3(0.0);
        
        for(float i = 0.0; i < 100.0; i++) {
          vec3 pos = origin + direction * depth;
          pos.xz *= rotX;

          vec3 deformed = pos;
          deformed.y *= uPillarHeight;
          deformed = applyWaveDeformation(deformed + vec3(0.0, uTime, 0.0), uTime);
          
          vec2 cosinePair = cos(deformed.xz);
          float fieldDistance = length(cosinePair) - 0.2;
          
          float radialBound = length(pos.xz) - uPillarWidth;
          fieldDistance = ${this.configurationTheme};
          fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

          vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
          color += gradient * pow(1.0 / fieldDistance, 1.0);

          if(fieldDistance < EPSILON || depth > maxDepth) break;
          depth += fieldDistance;
        }

        float widthNormalization = uPillarWidth / 3.0;
        color = tanh(color * uGlowAmount / widthNormalization);
        
        float rnd = noise(gl_FragCoord.xy);
        color -= rnd / 15.0 * uNoiseIntensity;
        
        gl_FragColor = vec4(color * uIntensity, 1.0);
      }
    `;

    // 4. Continuamos quitando el prefijo THREE en el Material y los Uniforms
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(width, height) }, // new Vector2
        uMouse: { value: this.mouse },
        uTopColor: { value: new Color(this.topColor) }, // new Color
        uBottomColor: { value: new Color(this.bottomColor) }, // new Color
        uIntensity: { value: this.intensity },
        uInteractive: { value: this.interactive },
        uGlowAmount: { value: this.glowAmount },
        uPillarWidth: { value: this.pillarWidth },
        uPillarHeight: { value: this.pillarHeight },
        uNoiseIntensity: { value: this.noiseIntensity },
        uPillarRotation: { value: this.pillarRotation }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    this.geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(this.geometry, this.material);
    this.scene.add(mesh);

    if (this.interactive) {
      this.ngZone.runOutsideAngular(() => {
        container.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
      });
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.ngZone.runOutsideAngular(() => this.animate());
  }

  private handleMouseMove(event: MouseEvent) {
      if (!this.interactive || !this.renderer) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.mouse.set(x, y);
  }

  private handleResize() {
    if (!this.renderer || !this.material || !this.containerRef) return;
    
    const container = this.containerRef.nativeElement;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    this.renderer.setSize(newWidth, newHeight);
    this.material.uniforms['uResolution'].value.set(newWidth, newHeight);
  }

  private animate() {
    if (!this.material || !this.renderer || !this.scene || !this.camera) return;

    this.time += 0.016 * this.rotationSpeed;
    this.material.uniforms['uTime'].value = this.time;
    this.renderer.render(this.scene, this.camera);

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  private cleanup() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.containerRef?.nativeElement?.contains(this.renderer.domElement)) {
        this.containerRef.nativeElement.removeChild(this.renderer.domElement);
      }
    }
    
    if (this.material) {
      this.material.dispose();
    }
    
    if (this.geometry) {
      this.geometry.dispose();
    }

    this.renderer = null;
    this.material = null;
    this.scene = null;
    this.camera = null;
    this.geometry = null;
  }
}