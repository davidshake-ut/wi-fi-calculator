'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { FileDown, FileText, Sheet, Save, Settings } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { useSession } from '@/components/SessionProvider';
import InputPanel from '@/components/InputPanel';
import CameraInputPanel from '@/components/CameraInputPanel';
import SettingsModal from '@/components/SettingsModal';
import { useBranding } from '@/hooks/useBranding';
import { readableTextHex } from '@/lib/colors';
import SummaryCards from '@/components/SummaryCards';
import BOMTable from '@/components/BOMTable';
import LaborTable from '@/components/LaborTable';
import CostSummary from '@/components/CostSummary';
import CameraSystems from '@/components/CameraSystems';
import ProductDatabase from '@/components/ProductDatabase';
import ProductModal from '@/components/ProductModal';
import { Button } from '@/components/ui/primitives';
import { calculateBOM } from '@/lib/calculateBOM';
import { calculateCameraBOM } from '@/lib/calculateCameraBOM';
import { calculateLabor } from '@/lib/calculateLabor';
import { estimateLaborHours } from '@/lib/estimateLaborHours';
import { useProducts } from '@/hooks/useProducts';
import { useProjects } from '@/hooks/useProjects';
import { DEFAULT_INPUTS, DEFAULT_CAMERA_INPUTS, DEFAULT_LABOR_ROLES } from '@/lib/defaults';
import { getTerminology } from '@/lib/terminology';
import { exportPDF, wifiKpis, cameraKpis } from '@/lib/exportPDF';
import { exportProposalPDF } from '@/lib/exportProposal';
import { exportCSV } from '@/lib/exportCSV';
import { buildScopeOfWork } from '@/lib/scopeOfWork';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'hardware', label: 'Managed Wi-Fi' },
  { id: 'cameras', label: 'Camera Systems' },
  { id: 'services', label: 'Services' },
  { id: 'summary', label: 'Summary' },
  { id: 'products', label: 'Product Database' },
];

function Calculator() {
  const { configured, session, company, user, isSuperAdmin, isAdmin, role, refresh } =
    useSession();

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [cameraInputs, setCameraInputs] = useState(DEFAULT_CAMERA_INPUTS);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [serviceOverrides, setServiceOverrides] = useState({});
  const [customLineItems, setCustomLineItems] = useState([]);
  const [laborRoles, setLaborRoles] = useState(DEFAULT_LABOR_ROLES);
  const [activeTab, setActiveTab] = useState('hardware');
  const [showMargin, setShowMargin] = useState(false);
  const [editPrices, setEditPrices] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [modal, setModal] = useState({ open: false, product: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [catalogTeamId, setCatalogTeamId] = useState('all');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!(isSuperAdmin && session && supabase)) return;
    void (async () => {
      const { data } = await supabase.from('companies').select('id, name').order('name');
      setTeams(data || []);
    })();
  }, [isSuperAdmin, session]);

  const { branding, setBranding } = useBranding({ configured, company, onSaved: refresh });
  const { allProducts, addProduct, editProduct, deleteProduct, importProducts } = useProducts(
    session,
    { teamFilter: catalogTeamId }
  );
  const { projects, loadProject, saveProject, deleteProject } = useProjects(session, company, user);

  const canManageCatalog = configured
    ? (role === 'company_admin' || isSuperAdmin) &&
      !!company &&
      (!isSuperAdmin || catalogTeamId === 'all' || catalogTeamId === company.id)
    : true;

  const bom = useMemo(
    () =>
      calculateBOM(
        inputs,
        priceOverrides,
        serviceOverrides,
        allProducts,
        customLineItems.filter((c) => c.system === 'wifi')
      ),
    [inputs, priceOverrides, serviceOverrides, allProducts, customLineItems]
  );

  const wifiEnabled = inputs.includeWifi !== false;
  const camerasEnabled = inputs.includeCameras !== false;
  const includeShipping = inputs.includeShipping !== false;
  const shippingPercent = inputs.shippingPercent ?? 7;

  const cameraBom = useMemo(
    () =>
      calculateCameraBOM(
        camerasEnabled ? cameraInputs : {},
        priceOverrides,
        serviceOverrides,
        allProducts,
        camerasEnabled ? customLineItems.filter((c) => c.system === 'camera') : [],
        { includeShipping, shippingPercent }
      ),
    [
      camerasEnabled,
      cameraInputs,
      priceOverrides,
      serviceOverrides,
      allProducts,
      customLineItems,
      includeShipping,
      shippingPercent,
    ]
  );

  const estimatedHours = useMemo(
    () => estimateLaborHours({ wifiBom: bom, cameraBom, inputs, cameraInputs }),
    [bom, cameraBom, inputs, cameraInputs]
  );
  const labor = useMemo(
    () => calculateLabor(laborRoles, estimatedHours),
    [laborRoles, estimatedHours]
  );

  const newCustomId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const addCustomLine = (system, segment) =>
    setCustomLineItems((prev) => [
      ...prev,
      { id: newCustomId(), system, segment, sku: '', description: '', qty: 1, cost: 0, price: 0 },
    ]);
  const updateCustomLine = (id, field, value) =>
    setCustomLineItems((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const removeCustomLine = (id) =>
    setCustomLineItems((prev) => prev.filter((c) => c.id !== id));
  const term = getTerminology(inputs.propertyType);

  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'hardware') return wifiEnabled;
    if (t.id === 'cameras') return camerasEnabled;
    return true;
  });
  const tab = visibleTabs.some((t) => t.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id || 'summary';

  const onCameras = tab === 'cameras';
  const dashView = tab === 'hardware' ? 'wifi' : onCameras ? 'cameras' : 'both';

  const hasChanges = useMemo(() => {
    if (!savedSnapshot) {
      return (
        Object.keys(priceOverrides).length > 0 ||
        Object.keys(serviceOverrides).length > 0 ||
        customLineItems.length > 0 ||
        JSON.stringify(inputs) !== JSON.stringify(DEFAULT_INPUTS) ||
        JSON.stringify(cameraInputs) !== JSON.stringify(DEFAULT_CAMERA_INPUTS) ||
        JSON.stringify(laborRoles) !== JSON.stringify(DEFAULT_LABOR_ROLES)
      );
    }
    return (
      JSON.stringify(inputs) !== JSON.stringify(savedSnapshot.inputs) ||
      JSON.stringify(cameraInputs) !== JSON.stringify(savedSnapshot.cameraInputs) ||
      JSON.stringify(priceOverrides) !== JSON.stringify(savedSnapshot.priceOverrides) ||
      JSON.stringify(serviceOverrides) !== JSON.stringify(savedSnapshot.serviceOverrides) ||
      JSON.stringify(customLineItems) !== JSON.stringify(savedSnapshot.customLineItems) ||
      JSON.stringify(laborRoles) !== JSON.stringify(savedSnapshot.laborRoles ?? DEFAULT_LABOR_ROLES)
    );
  }, [inputs, cameraInputs, priceOverrides, serviceOverrides, customLineItems, laborRoles, savedSnapshot]);

  const selectProject = (id) => {
    if (!id) {
      setInputs(DEFAULT_INPUTS);
      setCameraInputs(DEFAULT_CAMERA_INPUTS);
      setPriceOverrides({});
      setServiceOverrides({});
      setCustomLineItems([]);
      setLaborRoles(DEFAULT_LABOR_ROLES);
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
    setCustomLineItems(loaded.customLineItems);
    setLaborRoles(loaded.laborRoles);
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
        customLineItems,
        laborRoles,
      });
      setCurrentProjectId(saved.id);
      setSavedSnapshot({
        inputs,
        cameraInputs,
        priceOverrides,
        serviceOverrides,
        customLineItems,
        laborRoles,
      });
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportSections = () => {
    const list = [{ title: 'Managed Wi-Fi', label: 'Wi-Fi', bom, kpis: wifiKpis(bom, term) }];
    if (cameraBom.totalCameras > 0) {
      list.push({
        title: 'Camera Systems',
        label: 'Camera',
        bom: cameraBom,
        kpis: cameraKpis(cameraBom),
      });
    }
    if (labor.serviceItems.length > 0) {
      list.push({ title: 'Professional Labor', label: 'Labor', isLabor: true, bom: labor });
    }
    return list;
  };

  const hasCameras = cameraBom.totalCameras > 0;
  const hasWifi = bom.items.length > 0;
  const systemsTitle =
    hasWifi && hasCameras
      ? 'Wi-Fi & Camera Systems'
      : hasCameras
        ? 'Camera Systems'
        : 'Managed Wi-Fi';

  const handleExportCSV = () =>
    exportCSV(inputs, exportSections(), { fileSuffix: 'Quote', companyName: branding.companyName });

  const handleExportPDF = () =>
    exportPDF(inputs, exportSections(), {
      title: `${systemsTitle} — Budgetary Quote`,
      footerLabel: systemsTitle,
      fileSuffix: 'Quote',
      branding,
    });

  const handleExportProposal = () =>
    exportProposalPDF({ inputs, cameraInputs, term, sections: exportSections(), branding });

  const saveCatalog = async (form) => {
    if (modal.product && !modal.clone) await editProduct(form);
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

  const brandText = readableTextHex(branding.primaryColor);

  return (
    <div
      className="flex flex-col"
      style={{ '--brand': branding.primaryColor, '--brand-text': brandText }}
    >
      {/* Compact builder action bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">System Builder</p>
            <h1 className="truncate text-sm font-semibold text-slate-900">
              {inputs.propertyName || branding.companyName || 'Untitled Project'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={!hasChanges || busy || (configured && !company)}
              title={configured && !company ? 'Join a team to save projects' : undefined}
              onClick={handleSave}
            >
              <Save size={14} /> {currentProjectId ? 'Update Project' : 'Save Project'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Sheet size={14} /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileDown size={14} /> PDF
            </Button>
            <Button size="sm" onClick={handleExportProposal} title="Customer-facing proposal (sell price only)">
              <FileText size={14} /> Proposal
            </Button>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings (technologies, branding)"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700"
            >
              <Settings size={15} />
            </button>
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
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  tab === t.id
                    ? 'bg-[var(--brand,#2563eb)] text-[var(--brand-text,#fff)] shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <SummaryCards
            view={dashView}
            bom={bom}
            cameraBom={cameraBom}
            labor={labor}
            term={term}
          />

          {tab === 'hardware' && (
            <BOMTable
              bom={bom}
              showMargin={showMargin}
              setShowMargin={setShowMargin}
              priceOverrides={priceOverrides}
              setPriceOverrides={setPriceOverrides}
              editPrices={editPrices}
              setEditPrices={setEditPrices}
              onAddCustom={(seg) => addCustomLine('wifi', seg)}
              onUpdateCustom={updateCustomLine}
              onRemoveCustom={removeCustomLine}
            />
          )}
          {tab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMargin((s) => !s)}>
                  {showMargin ? 'Hide Cost & Margin' : 'Show Cost & Margin'}
                </Button>
              </div>
              <LaborTable
                roles={laborRoles}
                setRoles={setLaborRoles}
                showMargin={showMargin}
                estimatedHours={estimatedHours}
              />
              <p className="px-1 text-xs italic text-slate-400">
                Set hours and rates per worker level — this drives all professional labor on the
                Wi-Fi, camera, and combined quotes.
              </p>
            </div>
          )}
          {tab === 'summary' && (
            <CostSummary
              sections={exportSections()}
              scope={buildScopeOfWork({ inputs, cameraInputs, wifiBom: bom, cameraBom, term })}
            />
          )}
          {tab === 'cameras' && (
            <CameraSystems
              cameraBom={cameraBom}
              showMargin={showMargin}
              setShowMargin={setShowMargin}
              priceOverrides={priceOverrides}
              setPriceOverrides={setPriceOverrides}
              editPrices={editPrices}
              setEditPrices={setEditPrices}
              onAddCustom={(seg) => addCustomLine('camera', seg)}
              onUpdateCustom={updateCustomLine}
              onRemoveCustom={removeCustomLine}
            />
          )}
          {tab === 'products' && (
            <ProductDatabase
              allProducts={allProducts}
              canManageCatalog={canManageCatalog}
              teams={isSuperAdmin ? teams : null}
              teamFilter={catalogTeamId}
              onTeamFilterChange={setCatalogTeamId}
              onAdd={() => setModal({ open: true, product: null })}
              onEdit={(p) => setModal({ open: true, product: p })}
              onClone={(p) =>
                setModal({ open: true, product: { ...p, sku: `${p.sku}-COPY` }, clone: true })
              }
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
          clone={modal.clone}
          onClose={() => setModal({ open: false, product: null })}
          onSave={saveCatalog}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          branding={branding}
          canManageBranding={canManageCatalog}
          includeWifi={wifiEnabled}
          includeCameras={camerasEnabled}
          includeShipping={includeShipping}
          shippingPercent={shippingPercent}
          onSetInput={(key, val) => setInputs((prev) => ({ ...prev, [key]: val }))}
          onSave={async (b) => {
            try {
              await setBranding(b);
              setSettingsOpen(false);
            } catch (e) {
              alert(`Could not save branding: ${e.message}`);
            }
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <AuthGuard>
      <OSShell>
        <Calculator />
      </OSShell>
    </AuthGuard>
  );
}
