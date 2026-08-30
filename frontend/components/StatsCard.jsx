"use client";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "teal",
}) {
  const colorMap = {
    teal: {
      bar: "bg-teal-400",
      glow: "from-teal-500/20 to-transparent",
      iconBg: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    },
    emerald: {
      bar: "bg-emerald-400",
      glow: "from-emerald-500/20 to-transparent",
      iconBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    cyan: {
      bar: "bg-cyan-400",
      glow: "from-cyan-500/20 to-transparent",
      iconBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
    amber: {
      bar: "bg-amber-400",
      glow: "from-amber-500/20 to-transparent",
      iconBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    rose: {
      bar: "bg-rose-400",
      glow: "from-rose-500/20 to-transparent",
      iconBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
    indigo: {
      bar: "bg-indigo-400",
      glow: "from-indigo-500/20 to-transparent",
      iconBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div className="glass-panel-interactive relative overflow-hidden rounded-3xl p-6">
      {/* Background soft glow */}
      <div className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-br ${scheme.glow} opacity-30 blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div>
          <div className={`mb-3 h-1.5 w-10 rounded-full ${scheme.bar}`} />
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{title}</p>
        </div>

        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${scheme.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="font-mono text-3xl font-black text-white tracking-tight lg:text-4xl">
          {value !== undefined && value !== null ? value : "--"}
        </p>

        {trend && (
          <span className="text-xs font-semibold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}