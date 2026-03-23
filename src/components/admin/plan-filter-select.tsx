'use client';

interface PlanFilterSelectProps {
  plans: { id: string; name_ar: string }[];
  currentPlan: string;
}

export function PlanFilterSelect({ plans, currentPlan }: PlanFilterSelectProps) {
  if (!plans || plans.length === 0) return null;
  return (
    <select
      defaultValue={currentPlan}
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value) url.searchParams.set('plan', e.target.value);
        else url.searchParams.delete('plan');
        url.searchParams.delete('page');
        window.location.href = url.toString();
      }}
      className="border rounded-md px-3 h-9 text-sm bg-background"
    >
      <option value="">كل الخطط</option>
      {plans.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name_ar}
        </option>
      ))}
    </select>
  );
}
