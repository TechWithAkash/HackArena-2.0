"use client";

interface Factor {
  factor: string;
  contribution: number;
  description: string;
}

interface Props {
  drivers: Factor[];
  protective: Factor[];
}

function FactorRow({ factor, contribution, description, isDriver }: Factor & { isDriver: boolean }) {
  const abs = Math.abs(contribution);
  const maxBar = 12;
  const width = Math.min(100, (abs / maxBar) * 100);

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: isDriver ? "#EF4444" : "#10B981" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm text-gray-800 font-bold capitalize tracking-tight">{factor.replace(/_/g, " ")}</span>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${isDriver ? "text-red-500" : "text-emerald-500"}`}>
            {isDriver ? "+" : ""}{contribution.toFixed(2)} <span className="opacity-70">SHAP</span>
          </span>
        </div>
        <div className="w-full bg-gray-50 rounded-full h-1.5 mb-2">
          <div
            className="h-1.5 rounded-full shadow-sm"
            style={{ width: `${width}%`, background: isDriver ? "#FCA5A5" : "#6EE7B7" }}
          />
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

export default function InsightsBar({ drivers, protective }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-4">Negative Divergence (Risk Drivers)</p>
        {drivers.length === 0 ? (
          <p className="text-sm text-gray-400">No risk drivers found</p>
        ) : (
          <div className="divide-y divide-gray-50 space-y-2">
            {drivers.map((d) => (
              <FactorRow key={d.factor} {...d} isDriver={true} />
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-4">Biological Equilibrium (Protectors)</p>
        {protective.length === 0 ? (
          <p className="text-sm text-gray-400">No protective factors found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {protective.map((p) => (
              <FactorRow key={p.factor} {...p} isDriver={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
