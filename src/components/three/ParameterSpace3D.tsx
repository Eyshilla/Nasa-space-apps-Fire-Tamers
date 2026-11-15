import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw } from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { isInLunarZone } from '../../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
  testCategoryColor,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard } from '../ChartCard';

interface ParameterSpace3DProps {
  tests: Psi159Test[];
  loading?: boolean;
}

type ZAxisMetric = 'peak_burner_temp_c' | 'hc_flow_mg_s' | 'burn_time_s';

const mapX = (psi: number) => ((psi - 6) / 44) * 10 - 5;
const mapY = (o2: number) => ((o2 - 0.1) / 0.8) * 7 - 3.5;
const mapZ = (val: number, max: number) =>
  (Math.min(max, Math.max(0, val)) / max) * 10 - 5;

export const ParameterSpace3D: React.FC<ParameterSpace3DProps> = ({
  tests,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectTest = usePsiStore((s) => s.selectTest);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const zOptions = useMemo(
    () => [
      { key: 'peak_burner_temp_c' as const, label: tStr.param3d.zPeak, unit: '°C', max: 700 },
      { key: 'hc_flow_mg_s' as const, label: tStr.param3d.zFlow, unit: 'mg/s', max: 3.3 },
      { key: 'burn_time_s' as const, label: tStr.param3d.zBurn, unit: 's', max: 260 },
    ],
    [tStr]
  );

  const [zMetric, setZMetric] = useState<ZAxisMetric>('peak_burner_temp_c');
  const [localFlameFilter, setLocalFlameFilter] = useState<'all' | 'normal' | 'inverse'>('all');
  const [webglError, setWebglError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{
    test: Psi159Test;
    left: number;
    top: number;
  } | null>(null);

  const visibleTests = useMemo(() => {
    if (localFlameFilter === 'all') return tests;
    return tests.filter((t) => t.flame_type === localFlameFilter);
  }, [tests, localFlameFilter]);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(8.5, 6.2, 9.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || visibleTests.length === 0) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL indisponível neste navegador para o espaço 3D.');
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
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(8.5, 6.2, 9.5);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xdbeafe, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(8, 12, 10);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    rimLight.position.set(-8, -4, -6);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b);
    grid.position.y = -3.5;
    scene.add(grid);

    const outerBoxGeo = new THREE.BoxGeometry(10, 7, 10);
    const outerEdges = new THREE.EdgesGeometry(outerBoxGeo);
    const outerLine = new THREE.LineSegments(
      outerEdges,
      new THREE.LineBasicMaterial({ color: 0x243252, transparent: true, opacity: 0.7 })
    );
    scene.add(outerLine);

    const lunarXMin = mapX(6);
    const lunarXMax = mapX(10.2);
    const lunarYMin = mapY(0.3);
    const lunarYMax = mapY(0.9);
    const lunarGeo = new THREE.BoxGeometry(
      lunarXMax - lunarXMin,
      lunarYMax - lunarYMin,
      10
    );
    const lunarMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    });
    const lunarMesh = new THREE.Mesh(lunarGeo, lunarMat);
    lunarMesh.position.set(
      (lunarXMin + lunarXMax) / 2,
      (lunarYMin + lunarYMax) / 2,
      0
    );
    scene.add(lunarMesh);

    const lunarWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(lunarGeo),
      new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.6 })
    );
    lunarWire.position.copy(lunarMesh.position);
    scene.add(lunarWire);

    const zConf = zOptions.find((o) => o.key === zMetric)!;
    const sphereGeo = new THREE.SphereGeometry(
      0.16,
      isSoftwareGl ? 8 : 16,
      isSoftwareGl ? 6 : 12
    );
    const sphereMat = new THREE.MeshStandardMaterial({
      roughness: 0.32,
      metalness: 0.15,
    });

    const instanced = new THREE.InstancedMesh(
      sphereGeo,
      sphereMat,
      visibleTests.length
    );

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    visibleTests.forEach((t, idx) => {
      const rawZ = Number(t[zMetric] ?? 0);
      const scale = t.test_id === selectedTestId ? 1.7 : t.cool_flame ? 1.35 : 1.0;
      dummy.position.set(
        mapX(t.pressure_psi),
        mapY(t.o2_fraction),
        mapZ(rawZ, zConf.max)
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instanced.setMatrixAt(idx, dummy.matrix);

      color.set(testCategoryColor(t));
      instanced.setColorAt(idx, color);
    });

    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    instanced.computeBoundingSphere();
    scene.add(instanced);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(instanced);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const t = visibleTests[hits[0].instanceId];
        renderer.domElement.style.cursor = 'pointer';
        // Clamp strictly within canvas edges
        setHovered({
          test: t,
          left: Math.max(8, Math.min(rect.width - 208, e.clientX - rect.left + 12)),
          top: Math.max(8, Math.min(rect.height - 115, e.clientY - rect.top - 16)),
        });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHovered(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(instanced);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const t = visibleTests[hits[0].instanceId];
        selectTest(t.test_id, true);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      outerBoxGeo.dispose();
      outerEdges.dispose();
      lunarGeo.dispose();
      lunarMat.dispose();
      renderer.dispose();
    };
  }, [visibleTests, zMetric, selectedTestId, selectTest, zOptions]);

  const activeZLabel = zOptions.find((z) => z.key === zMetric)?.label ?? '';

  const legendItems = useMemo(
    () => [
      {
        id: 'lunar',
        label: tStr.param3d.legendLunar,
        shortLabel: tStr.ignitionChart.lunarZone,
        marker: <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400" />,
      },
      {
        id: 'axes',
        label: tStr.param3d.legendAxes(activeZLabel),
        shortLabel: `X/Y/Z: ${activeZLabel}`,
        marker: <span className="h-2 w-2 rounded-full bg-cyan-400" />,
      },
    ],
    [tStr, activeZLabel]
  );

  return (
    <ChartCard
      title={tStr.param3d.title}
      subtitle={tStr.param3d.subtitle}
      helpTitle={tStr.param3d.title}
      helpBody={tStr.param3d.legendLunar}
      chartContextPrompt={tStr.prompts.explainParam3d}
      chartContextLabel={tStr.param3d.title}
      legend={legendItems}
      footer={<span>{tStr.param3d.hintOrbit}</span>}
      isEmpty={visibleTests.length === 0}
      loading={loading}
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded border border-slate-700 bg-[#0B1020] p-0.5 text-[10px]">
            {(['all', 'normal', 'inverse'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLocalFlameFilter(mode)}
                className={`min-h-[22px] whitespace-nowrap rounded px-1.5 py-0.5 font-medium transition-colors ${
                  localFlameFilter === mode
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'all'
                  ? tStr.param3d.both
                  : flameTypeLabel(mode, lang)}
              </button>
            ))}
          </div>

          <select
            aria-label="Z-Axis"
            value={zMetric}
            onChange={(e) => setZMetric(e.target.value as ZAxisMetric)}
            className="min-h-[26px] rounded border border-slate-700 bg-[#0B1020] px-2 py-0.5 text-[11px] text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            {zOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                Z: {opt.label} ({opt.unit})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetCamera}
            className="inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:border-cyan-500/40"
          >
            <RotateCcw className="h-3 w-3 shrink-0" />
            <span>{tStr.param3d.reset}</span>
          </button>
        </div>
      }
    >
      {webglError ? (
        <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-400">
          {webglError}
        </div>
      ) : (
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-slate-800/80 bg-[#0B1020]">
          <div ref={containerRef} className="h-full w-full touch-none" />

          {hovered && (
            <div
              style={{
                zIndex: 'var(--z-tooltip)',
                left: hovered.left,
                top: hovered.top,
              }}
              className="pointer-events-none absolute w-48 rounded-lg border border-slate-700 bg-[#0B1020]/95 p-2 text-[11px] shadow-xl"
            >
              <div className="flex items-center justify-between gap-2 font-mono text-cyan-300">
                <span className="font-bold">{hovered.test.test_id}</span>
                <span className="text-[10px] text-slate-400">
                  {fuelLabel(hovered.test.fuel, lang)}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] tabular-nums text-slate-200">
                <div>
                  {flameTypeLabel(hovered.test.flame_type, lang)} ·{' '}
                  {Math.round(hovered.test.o2_fraction * 100)}% O₂
                </div>
                <div>
                  {formatNumber(hovered.test.pressure_psi, 1, lang)} psi ·{' '}
                  {formatNumber(hovered.test.peak_burner_temp_c, 0, lang)} °C
                </div>
              </div>
              <div className="mt-1 text-[10px] text-slate-300">
                {outcomeMeta(hovered.test.outcome, lang).glyph}{' '}
                {outcomeMeta(hovered.test.outcome, lang).label}
                {isInLunarZone(hovered.test) ? ' · Lunar' : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
};
