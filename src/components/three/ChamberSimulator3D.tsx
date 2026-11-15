import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Flame, Globe, Sparkles } from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import {
  flameColorLabel,
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard } from '../ChartCard';

interface ChamberSimulator3DProps {
  tests: Psi159Test[];
  loading?: boolean;
}

const BENCHMARKS = [
  { id: '21174 C6', label: 'PCI-A' },
  { id: '21291 C1', label: 'PCI-F' },
  { id: '21106 F2', label: 'Cool Only (Lunar)' },
  { id: '21242 A1', label: '651,5 °C · 85% O₂' },
  { id: '21162 A4', label: '304 s' },
  { id: '21196 A1', label: 'No Ignition' },
];

const FLAME_VERTEX = `
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vLocalPos;
uniform float uTime;
uniform float uGravity;
uniform float uIntensity;

void main() {
  vLocalPos = position;
  vec3 pos = position;
  float wave = sin(pos.x * 5.5 + uTime * 3.1) * cos(pos.z * 5.0 - uTime * 2.4) * 0.06 * uIntensity;
  pos += normal * wave;

  if (uGravity > 0.5) {
    float upFactor = smoothstep(-1.0, 1.0, pos.y);
    pos.y = pos.y * 1.65 + 0.65;
    float taper = mix(1.05, 0.35, upFactor);
    pos.x *= taper;
    pos.z *= taper;
    pos.x += sin(uTime * 5.0 + pos.y * 3.2) * 0.08 * upFactor;
  }

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = -mvPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FLAME_FRAGMENT = `
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vLocalPos;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uOpacity;
uniform float uTime;

void main() {
  vec3 viewDir = normalize(vViewPos);
  float ndotv = abs(dot(normalize(vNormal), viewDir));
  float rim = pow(1.0 - ndotv, 1.45);
  float pulse = 0.92 + 0.08 * sin(uTime * 4.2 + vLocalPos.y * 3.0);
  vec3 col = mix(uInnerColor, uOuterColor, clamp(rim * 1.15, 0.0, 1.0));
  float alpha = clamp((0.35 + rim * 0.7) * uOpacity * pulse, 0.0, 0.92);
  gl_FragColor = vec4(col * 1.3, alpha);
}
`;

export const ChamberSimulator3D: React.FC<ChamberSimulator3DProps> = ({
  tests,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const selectTest = usePsiStore((s) => s.selectTest);
  const askAi = usePsiStore((s) => s.askAi);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const [gravityMode, setGravityMode] = useState<'microg' | 'earth'>('microg');

  const activeTest = useMemo(() => {
    return (
      tests.find((t) => t.test_id === selectedTestId) ??
      tests.find((t) => t.test_id === '21174 C6') ??
      tests[0] ??
      null
    );
  }, [tests, selectedTestId]);

  const shaderUniformsRef = useRef<{
    uTime: { value: number };
    uGravity: { value: number };
    uIntensity: { value: number };
    uInnerColor: { value: THREE.Color };
    uOuterColor: { value: THREE.Color };
    uOpacity: { value: number };
  } | null>(null);

  const flameMeshRef = useRef<THREE.Mesh | null>(null);
  const haloMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const uniforms = shaderUniformsRef.current;
    const flameMesh = flameMeshRef.current;
    const haloMesh = haloMeshRef.current;
    if (!uniforms || !flameMesh || !haloMesh || !activeTest) return;

    uniforms.uGravity.value = gravityMode === 'earth' ? 1.0 : 0.0;
    const flowScale = Math.min(1.5, Math.max(0.75, 0.72 + activeTest.hc_flow_mg_s * 0.28));
    const o2Boost = 0.8 + activeTest.o2_fraction * 0.55;
    const baseScale = activeTest.ignited ? flowScale * o2Boost : 0.52;

    flameMesh.scale.setScalar(baseScale);
    haloMesh.scale.setScalar(baseScale * 1.28);

    if (!activeTest.ignited) {
      uniforms.uInnerColor.value.set('#334155');
      uniforms.uOuterColor.value.set('#475569');
      uniforms.uOpacity.value = 0.16;
      uniforms.uIntensity.value = 0.25;
    } else if (activeTest.cool_flame || activeTest.ignition_type === 'cool') {
      uniforms.uInnerColor.value.set('#C084FC');
      uniforms.uOuterColor.value.set('#38BDF8');
      uniforms.uOpacity.value = 0.52;
      uniforms.uIntensity.value = 0.7;
    } else if (activeTest.flame_type === 'inverse') {
      uniforms.uInnerColor.value.set('#67E8F9');
      uniforms.uOuterColor.value.set('#F97316');
      uniforms.uOpacity.value = 0.78;
      uniforms.uIntensity.value = 1.05;
    } else if (
      activeTest.flame_color === 'yellow' ||
      activeTest.flame_color === 'yellow-blue'
    ) {
      uniforms.uInnerColor.value.set('#FDE047');
      uniforms.uOuterColor.value.set('#F97316');
      uniforms.uOpacity.value = 0.82;
      uniforms.uIntensity.value = 1.1;
    } else {
      uniforms.uInnerColor.value.set('#BAE6FD');
      uniforms.uOuterColor.value.set('#06B6D4');
      uniforms.uOpacity.value = 0.75;
      uniforms.uIntensity.value = 0.95;
    }
  }, [activeTest, gravityMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      return;
    }

    const gl = renderer.getContext();
    const rendererInfo = gl.getParameter(gl.RENDERER) as string | null;
    const isSoftwareGl =
      typeof rendererInfo === 'string' &&
      /swiftshader|llvmpipe|software/i.test(rendererInfo);

    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0b1020, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      50
    );
    camera.position.set(0, 1.4, 5.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 9;

    scene.add(new THREE.AmbientLight(0xcbd5e1, 0.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const chamberGeo = new THREE.CylinderGeometry(2.1, 2.1, 3.8, 16, 1, true);
    const chamberWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(chamberGeo),
      new THREE.LineBasicMaterial({ color: 0x243252, transparent: true, opacity: 0.65 })
    );
    scene.add(chamberWire);

    const burnerGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const burnerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.78,
      roughness: 0.42,
    });
    scene.add(new THREE.Mesh(burnerGeo, burnerMat));

    const stemGeo = new THREE.CylinderGeometry(0.055, 0.075, 1.85, 16);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.35,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = -1.1;
    scene.add(stem);

    const uniforms = {
      uTime: { value: 0 },
      uGravity: { value: 0 },
      uIntensity: { value: 1 },
      uInnerColor: { value: new THREE.Color('#BAE6FD') },
      uOuterColor: { value: new THREE.Color('#06B6D4') },
      uOpacity: { value: 0.75 },
    };
    shaderUniformsRef.current = uniforms;

    const flameGeo = new THREE.SphereGeometry(
      0.85,
      isSoftwareGl ? 18 : 36,
      isSoftwareGl ? 14 : 28
    );
    const flameMat = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERTEX,
      fragmentShader: FLAME_FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMeshRef.current = flameMesh;
    scene.add(flameMesh);

    const haloGeo = new THREE.SphereGeometry(0.98, 20, 20);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERTEX,
      fragmentShader: FLAME_FRAGMENT,
      uniforms: { ...uniforms, uOpacity: { value: 0.22 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMeshRef.current = haloMesh;
    scene.add(haloMesh);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      chamberGeo.dispose();
      burnerGeo.dispose();
      burnerMat.dispose();
      stemGeo.dispose();
      stemMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <ChartCard
      title={tStr.sim3d.title}
      subtitle={tStr.sim3d.subtitle}
      helpTitle={tStr.sim3d.title}
      helpBody={tStr.sim3d.microgCaption}
      chartContextPrompt={
        activeTest
          ? tStr.prompts.explainSim3dTest(
              activeTest.test_id,
              fuelLabel(activeTest.fuel, lang),
              flameTypeLabel(activeTest.flame_type, lang),
              Math.round(activeTest.o2_fraction * 100),
              formatNumber(activeTest.pressure_psi, 2, lang)
            )
          : undefined
      }
      chartContextLabel={tStr.sim3d.title}
      isEmpty={!activeTest}
      loading={loading}
      plotAutoHeight
      actions={
        <div className="flex flex-wrap items-center gap-1 rounded border border-slate-700 bg-[#0B1020] p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setGravityMode('microg')}
            className={`inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-medium transition-colors ${
              gravityMode === 'microg'
                ? 'bg-cyan-500/20 text-cyan-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-3 w-3 shrink-0" />
            {tStr.sim3d.microg}
          </button>
          <button
            type="button"
            onClick={() => setGravityMode('earth')}
            className={`inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-medium transition-colors ${
              gravityMode === 'earth'
                ? 'bg-amber-500/20 text-amber-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3 w-3 shrink-0" />
            {tStr.sim3d.earth1g}
          </button>
        </div>
      }
    >
      {activeTest && (
        <div className="grid items-start gap-4 lg:grid-cols-12">
          <div className="chart-card__plot min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-[#0B1020] lg:col-span-7">
            <div ref={containerRef} className="h-full w-full touch-none" />
            <div
              style={{ zIndex: 'var(--z-sticky)' }}
              className="pointer-events-none absolute left-2.5 top-2.5 max-w-[calc(100%-20px)] rounded border border-slate-800 bg-[#0B1020]/90 px-2.5 py-1.5 text-[11px]"
            >
              <div className="font-mono font-bold text-cyan-300">
                {activeTest.test_id}
              </div>
              <div className="wrap-anywhere text-[10px] text-slate-300">
                {gravityMode === 'microg'
                  ? tStr.sim3d.microgCaption
                  : tStr.sim3d.earthCaption}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-2.5 lg:col-span-5">
            <div className="min-w-0">
              <label
                htmlFor="sim-test-select"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {tStr.sim3d.activeTestLabel}
              </label>
              <select
                id="sim-test-select"
                value={activeTest.test_id}
                onChange={(e) => selectTest(e.target.value, false)}
                className="min-h-[32px] w-full rounded-md border border-slate-700 bg-[#0B1020] px-2.5 py-1.5 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              >
                {tests.map((t) => (
                  <option key={t.test_id} value={t.test_id}>
                    {t.test_id} · {fuelLabel(t.fuel, lang)} ·{' '}
                    {flameTypeLabel(t.flame_type, lang)} (
                    {Math.round(t.o2_fraction * 100)}% O₂)
                  </option>
                ))}
              </select>

              <div className="mt-2">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {tStr.sim3d.presetsLabel}
                </div>
                <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
                  {BENCHMARKS.map((b) => {
                    const exists = tests.some((t) => t.test_id === b.id);
                    if (!exists) return null;
                    const active = activeTest.test_id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => selectTest(b.id, false)}
                        className={`min-w-0 rounded border px-2 py-1.5 text-left transition-colors ${
                          active
                            ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                            : 'border-slate-800 bg-[#0B1020] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-mono text-[10px] font-semibold">
                          {b.id}
                        </div>
                        <div
                          title={b.label}
                          className="truncate text-[10px] text-slate-400"
                        >
                          {b.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0B1020] p-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
                <div>
                  <span className="text-slate-400">O₂:</span>{' '}
                  <span className="text-cyan-300">
                    {Math.round(activeTest.o2_fraction * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">P:</span>{' '}
                  <span className="text-slate-100">
                    {formatNumber(activeTest.pressure_psi, 2, lang)} psi
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{tStr.table.colBurn}:</span>{' '}
                  <span className="text-slate-100">
                    {activeTest.burn_time_s !== null
                      ? `${formatNumber(activeTest.burn_time_s, 1, lang)} s`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{tStr.table.colPeak}:</span>{' '}
                  <span className="text-red-300">
                    {activeTest.peak_burner_temp_c !== null
                      ? `${formatNumber(activeTest.peak_burner_temp_c, 1, lang)} °C`
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-800 pt-2 text-[11px]">
                <span className="wrap-anywhere text-slate-300">
                  {tStr.sim3d.colorLabel}:{' '}
                  <strong>{flameColorLabel(activeTest.flame_color, lang)}</strong> ·{' '}
                  {outcomeMeta(activeTest.outcome, lang).label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    askAi(
                      tStr.prompts.askSim3dTest(activeTest.test_id),
                      tStr.prompts.sim3dContextLabel(activeTest.test_id),
                      'analyze_test'
                    )
                  }
                  className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-cyan-300 hover:text-cyan-200"
                >
                  <Sparkles className="h-3 w-3 shrink-0" />
                  {tStr.sim3d.askAboutTest}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
};
