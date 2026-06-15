'use client';

import { Card, Field, NumberInput, Segmented, Toggle } from '@/components/ui/primitives';

function Section({ title, children }) {
  return (
    <Card className="border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

export default function CameraInputPanel({ cameraInputs, setCameraInputs }) {
  const set = (field, value) => setCameraInputs((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-3">
      <Section title="Cameras — 4MP (1080p class)">
        <Field label="Fixed Bullet">
          <NumberInput value={cameraInputs.cam4mpBullet} onChange={(v) => set('cam4mpBullet', v)} />
        </Field>
        <Field label="Fixed Turret">
          <NumberInput value={cameraInputs.cam4mpTurret} onChange={(v) => set('cam4mpTurret', v)} />
        </Field>
      </Section>

      <Section title="Cameras — 8MP (4K)">
        <Field label="Fixed Bullet">
          <NumberInput value={cameraInputs.cam8mpBullet} onChange={(v) => set('cam8mpBullet', v)} />
        </Field>
        <Field label="Fixed Turret">
          <NumberInput value={cameraInputs.cam8mpTurret} onChange={(v) => set('cam8mpTurret', v)} />
        </Field>
      </Section>

      <Section title="Licensing">
        <Field
          label="AI Camera Licenses"
          sub="Alpha Vision AI analytics — enter any quantity (need not match the camera count)"
        >
          <NumberInput value={cameraInputs.aiLicenses ?? 0} onChange={(v) => set('aiLicenses', v)} />
        </Field>
      </Section>

      <Section title="Recording">
        <Field
          label="Retention"
          sub="Sizes NVR storage — one HDD per 8-camera NVR"
        >
          <Segmented
            value={cameraInputs.retention}
            onChange={(v) => set('retention', v)}
            options={[
              { value: 'week', label: '~1 Week (2TB)' },
              { value: 'month', label: '~1 Month (8TB)' },
            ]}
          />
        </Field>
        <Toggle
          checked={cameraInputs.spareCameras}
          onChange={(v) => set('spareCameras', v)}
          label="Include Spare Cameras (5%)"
        />
      </Section>
    </div>
  );
}
