import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect
} from 'postprocessing';

const Hyperspeed = ({ effectOptions, active }) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    class App {
      constructor(container, options) {
        this.container = container;
        this.options = options;
        this.disposed = false;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
          options.fov || 75,
          container.clientWidth / container.clientHeight,
          0.1,
          10000
        );
        this.camera.position.set(0, 6, 15);

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(
          new EffectPass(this.camera, new BloomEffect({ intensity: 1.4 }))
        );

        const geometry = new THREE.PlaneGeometry(50, 400, 1, 200);
        const material = new THREE.MeshBasicMaterial({
          color: 0x03b3c3,
          wireframe: true,
          transparent: true,
          opacity: 0.6
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.mesh);

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.animate();

        window.addEventListener('resize', this.resize.bind(this));
      }

      animate() {
        if (this.disposed) return;
        requestAnimationFrame(this.animate);
        const t = this.clock.getElapsedTime();
        this.mesh.rotation.z = t * 0.15;
        this.composer.render();
      }

      resize() {
        if (this.disposed) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
      }

      dispose() {
        this.disposed = true;
        this.renderer.dispose();
        this.composer.dispose();
        this.scene.clear();
        window.removeEventListener('resize', this.resize);
        if (this.renderer.domElement.parentNode) {
          this.renderer.domElement.remove();
        }
      }
    }

    appRef.current = new App(containerRef.current, effectOptions);

    return () => {
      appRef.current?.dispose();
      appRef.current = null;
    };
  }, [effectOptions]);

  // fade-out → destroy
  useEffect(() => {
    if (!active && appRef.current) {
      const t = setTimeout(() => {
        appRef.current?.dispose();
        appRef.current = null;
      }, 600);
      return () => clearTimeout(t);
    }
  }, [active]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Hyperspeed;
