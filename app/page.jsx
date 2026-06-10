'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileDown, Sheet, Wifi, Save, Shield, LogOut } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useSession } from '@/components/SessionProvider';
import InputPanel from '@/components/InputPanel';
import CameraInputPanel from '@/components/CameraInputPanel';
import SummaryCards from '@/components/SummaryCards';
import BOMTable from '@/components/BOMTable';
import ServicesTable from '@/components/ServicesTable';
import CostSummary from '@/components/CostSummary';
import CameraSystems from '@/components/CameraSystems';
import ProductDatabase from '@/components/ProductDatabase';
import ProductModal from '@/components/ProductModal';
import { Button } from '@/components/ui/primitives';
import { calculateBOM } from '@/lib/calculateBOM';
import { calculateCameraBOM } from '@/lib/calculateCameraBOM';
import { useProducts } from '@/hooks/useProducts';
import { useProjects } from '@/hooks/useProjects';
import { DEFAULT_INPUTS, DEFAULT_CAMERA_INPUTS } from '@/lib/defaults';
import { getTerminology } from '@/lib/terminology';
import { exportPDF, wifiKpis, cameraKpis } from '@/lib/exportPDF';
import { exportCSV } from '@/lib/exportCSV';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'hardware', label: 'Managed Wi-Fi' },
  { id: 'cameras', label: 'Camera Systems' },
  { id: 'services', label: 'Services' },
  { id: 'summary', label: 'Summary' },
  { id: 'products', label: 'Product Database' },
];

function Calculator() {
  const { configured, session, company, user, isSuperAdmin, role, signOut } = useSession();

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [cameraInputs, setCameraInputs] = useState(DEFAULT_CAMERA_INPUTS);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [serviceOverrides, setServiceOverrides] = useState({});
  const [activeTab, setActiveTab] = useState('hardware');
  const [showMargin, setShowMargin] = useState(false);
  const [editServices, setEditServices] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [modal, setModal] = useState({ open: false, product: null });
  const [busy, setBusy] = useState(false);

  const { allProducts, addProduct, editProduct, deleteProduct, importProducts } = useProducts(session);
  const { projects, loadProject, saveProject, deleteProject } = useProjects(session, company, user);

  // Local mode (no backend) has no roles — the local user manages their own
  // catalog. Otherwise it's gated to company_admin / super_admin.
  const canManageCatalog = !configured || role === 'company_admin' || isSuperAdmin;

  const bom = useMemo(
    () => calculateBOM(inputs, priceOverrides, serviceOverrides, allProducts),
    [inputs, priceOverrides, serviceOverrides, allProducts]
  );
  const cameraBom = useMemo(
    () => calculateCameraBOM(cameraInputs, priceOverrides, serviceOverrides, allProducts),
    [cameraInputs, priceOverrides, serviceOverrides, allProducts]
  );
  const term = getTerminology(inputs.propertyType);

  const onCameras = activeTab === 'cameras';

  const hasChanges = useMemo(() => {
    if (!savedSnapshot) {
      return (
        Object.keys(priceOverrides).length > 0 ||
        Object.keys(serviceOverrides).length > 0 ||
        inputs.propertyName !== '' ||
        JSON.stringify(cameraInputs) !== JSON.stringify(DEFAULT_CAMERA_INPUTS)
      );
    }
    return (
      JSON.stringify(inputs) !== JSON.stringify(savedSnapshot.inputs) ||
      JSON.stringify(cameraInputs) !== JSON.stringify(savedSnapshot.cameraInputs) ||
      JSON.stringify(priceOverrides) !== JSON.stringify(savedSnapshot.priceOverrides) ||
      JSON.stringify(serviceOverrides) !== JSON.stringify(savedSnapshot.serviceOverrides)
    );
  }, [inputs, cameraInputs, priceOverrides, serviceOverrides, savedSnapshot]);

  const selectProject = (id) => {
    if (!id) {
      setInputs(DEFAULT_INPUTS);
      setCameraInputs(DEFAULT_CAMERA_INPUTS);
      setPriceOverrides({});
      setServiceOverrides({});
      setCurrentProjectId(null);
      setSavedSnapshot(null);
      return;
    }
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const loaded = loadProject(project);
    setInputs(loaded.inputs);
    setCameraInputs(loaded.cameraInputs);
    setPriceOverrides(loaded.priceOverrides);
    setServiceOverrides(loaded.serviceOverrides);
    setCurrentProjectId(project.id);
    setSavedSnapshot(loaded);
  };

  const handleSave = async () => {
    if (!inputs.propertyName.trim()) {
      alert('Enter a project / property name before saving.');
      return;
    }
    setBusy(true);
    try {
      const saved = await saveProject({
        id: currentProjectId,
        projectName: inputs.propertyName,
        inputs,
        cameraInputs,
        priceOverrides,
        serviceOverrides,
      });
      setCurrentProjectId(saved.id);
      setSavedSnapshot({ inputs, cameraInputs, priceOverrides, serviceOverrides });
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // Exports always include both systems, each in its own section (camera
  // section only when cameras are configured).
  const exportSections = () => {
    const list = [{ title: 'Managed Wi-Fi', bom, kpis: wifiKpis(bom, term) }];
    if (cameraBom.totalCameras > 0) {
      list.push({ title: 'Camera Systems', bom: cameraBom, kpis: cameraKpis(cameraBom) });
    }
    return list;
  };

  const hasCameras = cameraBom.totalCameras > 0;

  const handleExportCSV = () => exportCSV(inputs, exportSections(), { fileSuffix: 'Quote' });

  const handleExportPDF = () =>
    exportPDF(inputs, exportSections(), {
      title: hasCameras
        ? 'Wi-Fi & Camera Systems — Budgetary Quote'
        : 'Managed Wi-Fi — Budgetary Quote',
      footerLabel: hasCameras ? 'Managed Systems' : 'Managed Wi-Fi',
      fileSuffix: 'Quote',
    });

  const saveCatalog = async (form) => {
    if (modal.product) await editProduct(form);
    else await addProduct(form);
  };

  const removeCatalog = async (p) => {
    if (!confirm(`Delete ${p.sku}?`)) return;
    try {
      await deleteProduct(p.sku);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-600/30">
              <Wifi size={18} />
            </span>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold text-slate-900">
                Managed Wi-Fi — BOM Calculator
              </h1>
              <p className="text-xs text-slate-400">
                {company?.name || inputs.propertyName || 'Untitled Project'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!hasChanges || busy} onClick={handleSave}>
              <Save size={14} /> {currentProjectId ? 'Update Project' : 'Save Project'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Sheet size={14} /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileDown size={14} /> PDF
            </Button>
            {isSuperAdmin && (
              <Link
                href="/admin"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Shield size={14} /> Admin
              </Link>
            )}
            {configured && session && (
              <button onClick={signOut} title="Sign out" className="text-slate-400 hover:text-slate-700">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[350px]">
          {onCameras ? (
            <CameraInputPanel cameraInputs={cameraInputs} setCameraInputs={setCameraInputs} />
          ) : (
            <InputPanel
              inputs={inputs}
              setInputs={setInputs}
              term={term}
              projects={projects}
              currentProjectId={currentProjectId}
              onSelectProject={selectProject}
            />
          )}
        </aside>

        <main className="flex-1 space-y-4">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm shadow-slate-900/[0.03]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  activeTab === t.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!onCameras && <SummaryCards bom={bom} term={term} />}

          {activeTab === 'hardware' && (
            <BOMTable bom={bom} showMargin={showMargin} setShowMargin={setShowMargin} />
          )}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMargin((s) => !s)}>
                  {showMargin ? 'Hide Cost & Margin' : 'Show Cost & Margin'}
                </Button>
                <Button
                  variant={editServices ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditServices((e) => !e)}
                >
                  {editServices ? 'Done Editing' : 'Edit Values'}
                </Button>
              </div>
              <ServicesTable
                bom={bom}
                title="Wi-Fi Professional Services"
                serviceOverrides={serviceOverrides}
                setServiceOverrides={setServiceOverrides}
                showMargin={showMargin}
                editServices={editServices}
              />
              {cameraBom.serviceItems.length > 0 ? (
                <ServicesTable
                  bom={cameraBom}
                  title="Camera Professional Services"
                  serviceOverrides={serviceOverrides}
                  setServiceOverrides={setServiceOverrides}
                  showMargin={showMargin}
                  editServices={editServices}
                />
              ) : (
                <p className="px-1 text-xs italic text-slate-400">
                  Add cameras on the Camera Systems tab to generate camera labor here.
                </p>
              )}
            </div>
          )}
          {activeTab === 'summary' && <CostSummary bom={bom} />}
          {activeTab === 'cameras' && (
            <CameraSystems
              cameraBom={cameraBom}
              showMargin={showMargin}
              setShowMargin={setShowMargin}
            />
          )}
          {activeTab === 'products' && (
            <ProductDatabase
              allProducts={allProducts}
              priceOverrides={priceOverrides}
              setPriceOverrides={setPriceOverrides}
              canManageCatalog={canManageCatalog}
              onAdd={() => setModal({ open: true, product: null })}
              onEdit={(p) => setModal({ open: true, product: p })}
              onDelete={removeCatalog}
              onImport={importProducts}
            />
          )}
        </main>
      </div>

      {modal.open && (
        <ProductModal
          open={modal.open}
          product={modal.product}
          onClose={() => setModal({ open: false, product: null })}
          onSave={saveCatalog}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Calculator />
    </AuthGuard>
  );
}
