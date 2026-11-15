import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw } from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import {
  flameTypeLabel,
  formatNumber,
  testCategoryColor,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard } from '../ChartCard';
import {
  PointTooltipPopover,
  useClusterTooltip,
  type PointTooltipAnchor,
} from '../PointTooltipPopover';

interface ParameterSpace3DProps {
  tests: Psi159Test[];
  loading?: boolean;
}

interface Cluster3D {
  id: string;
  x: number;
  y: number;
  z: number;
  tests: Psi159Test[];
  rep: Psi159Test;
  color: string;
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
  const clusterTooltip = useClusterTooltip<Cluster3D>((c) => c.id);
  const tooltipActionsRef = useRef(clusterTooltip);
  tooltipActionsRef.current = clusterTooltip;

  const visibleTests = useMemo(() => {
    if (localFlameFilter === 'all') return tests;
    return tests.filter((t) => t.flame_type === localFlameFilter);
  }, [tests, localFlameFilter]);

  const clusters3D = useMemo<Cluster3D[]>(() => {
    const zConf = zOptions.find((o) => o.key === zMetric)!;
    const sorted = [...visibleTests].sort((a, b) => {
      const pa = a.test_id === selectedTestId ? 4 : a.cool_flame ? 3 : a.hit_burner_temp_limit ? 2 : 1;
      const pb = b.test_id === selectedTestId ? 4 : b.cool_flame ? 3 : b.hit_burner_temp_limit ? 2 : 1;
      return pb - pa;
    });
    const groups: Cluster3D[] = [];
    const distSqThreshold = 0.03;
    for (const t of sorted) {
      const rawZ = Number(t[zMetric] ?? 0);
      const x = mapX(t.pressure_psi);
      const y = mapY(t.o2_fraction);
      const z = mapZ(rawZ, zConf.max);
      let matched: Cluster3D | null = null;
      for (const g of groups) {
        const dx = g.x - x;
        const dy = g.y - y;
        const dz = g.z - z;
        if (dx * dx + dy * dy + dz * dz <= distSqThreshold) {
          matched = g;
          break;
        }
      }
      if (matched) {
        matched.tests.push(t);
      } else {
        groups.push({
          id: t.test_id,
          x,
          y,
          z,
          tests: [t],
          rep: t,
          color: testCategoryColor(t),
        });
      }
    }
    return groups;
  }, [visibleTests, zMetric, zOptions, selectedTestId]);

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
    const initialW = Math.max(1, container.clientWidth);
    const initialH = Math.max(240, container.clientHeight);
    renderer.setSize(initialW, initialH);
    renderer.setClearColor(0x0b1020, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      initialW / Math.max(1, initialH),
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
      clusters3D.length
    );

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    clusters3D.forEach((cluster, idx) => {
      const hasSelected = cluster.tests.some((t) => t.test_id === selectedTestId);
      const hasCool = cluster.tests.some((t) => t.cool_flame);
      const countBoost = cluster.tests.length > 1 ? 1.35 : 1.0;
      const scale = hasSelected ? 1.75 : hasCool ? Math.max(1.35, countBoost) : countBoost;
      dummy.position.set(cluster.x, cluster.y, cluster.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instanced.setMatrixAt(idx, dummy.matrix);

      color.set(cluster.color);
      instanced.setColorAt(idx, color);
    });

    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    instanced.computeBoundingSphere();
    scene.add(instanced);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const projectedVec = new THREE.Vector3();
    let pointerDownPos = { x: 0, y: 0 };

    const clusterToAnchor = (cluster: Cluster3D): PointTooltipAnchor => {
      const rect = renderer.domElement.getBoundingClientRect();
      projectedVec.set(cluster.x, cluster.y, cluster.z).project(camera);
      return {
        x: rect.left + (projectedVec.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-projectedVec.y * 0.5 + 0.5) * rect.height,
        width: 18,
        height: 18,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(instanced);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        renderer.domElement.setAttribute('data-point-trigger', 'true');
      } else {
        renderer.domElement.removeAttribute('data-point-trigger');
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(instanced);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const cluster = clusters3D[hits[0].instanceId];
        renderer.domElement.style.cursor = 'pointer';
        renderer.domElement.setAttribute('data-point-trigger', 'true');
        tooltipActionsRef.current.onPointEnter(cluster, clusterToAnchor(cluster));
      } else {
        renderer.domElement.style.cursor = 'grab';
        renderer.domElement.removeAttribute('data-point-trigger');
        tooltipActionsRef.current.onPointLeave();
      }
    };

    const onPointerLeaveCanvas = () => {
      tooltipActionsRef.current.onPointLeave();
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
        const cluster = clusters3D[hits[0].instanceId];
        if (cluster.tests.length === 1) {
          tooltipActionsRef.current.closeAll();
          selectTest(cluster.rep.test_id, true);
        } else {
          tooltipActionsRef.current.onPointClick(
            cluster,
            clusterToAnchor(cluster),
            cluster.id,
            e.pointerType || 'mouse'
          );
        }
      } else {
        tooltipActionsRef.current.closeAll();
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeaveCanvas);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let retryFrameId = 0;
    let retriesLeft = 10;
    const syncRendererSize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) {
        if (retriesLeft > 0) {
          retriesLeft -= 1;
          retryFrameId = requestAnimationFrame(syncRendererSize);
        }
        return;
      }
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(syncRendererSize);
    resizeObserver.observe(container);
    syncRendererSize();

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(retryFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeaveCanvas);
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
  }, [clusters3D, visibleTests.length, selectedTestId, selectTest, zOptions]);

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
      helpBody={`${tStr.param3d.legendLunar}. ${tStr.param3d.helpTip}`}
      chartContextPrompt={tStr.prompts.explainParam3d}
      chartContextLabel={tStr.param3d.title}
      legend={legendItems}
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
        <div
          style={{ minHeight: 240 }}
          className="relative h-full min-h-0 flex-1 w-full overflow-hidden rounded-lg border border-slate-800/80 bg-[#0B1020]"
        >
          <div
            ref={containerRef}
            style={{ minHeight: 240 }}
            className="h-full w-full touch-none"
          />

          <div
            style={{ zIndex: 'var(--z-sticky)' }}
            className="chart-text-annotation pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-16px)] rounded border border-slate-800/90 bg-[#0B1020]/88 px-2.5 py-1 text-slate-300"
          >
            <span className="wrap-anywhere font-mono">
              {tStr.param3d.legendAxes(activeZLabel)}
            </span>
          </div>

          <PointTooltipPopover
            open={Boolean(clusterTooltip.active)}
            pinned={clusterTooltip.isPinned}
            anchor={clusterTooltip.active?.anchor ?? null}
            tests={clusterTooltip.active?.data.tests ?? []}
            headerSummary={
              clusterTooltip.active && clusterTooltip.active.data.tests.length > 1
                ? `${tStr.pointPopover.testsCount(
                    clusterTooltip.active.data.tests.length
                  )} · ${Math.round(
                    clusterTooltip.active.data.rep.o2_fraction * 100
                  )}% O₂ · ${formatNumber(
                    clusterTooltip.active.data.rep.pressure_psi,
                    1,
                    lang
                  )} psi`
                : undefined
            }
            onPointerEnterPopover={clusterTooltip.onPopoverEnter}
            onPointerLeavePopover={clusterTooltip.onPopoverLeave}
            onPin={clusterTooltip.pinActive}
            onClose={clusterTooltip.closeAll}
          />
        </div>
      )}
    </ChartCard>
  );
};
