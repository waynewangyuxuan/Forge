import React, { useState, useEffect } from 'react';

// Forge UI Demo - "Warm Industrial" Aesthetic (Light Mode)
// Warm white background, clean and non-intimidating

export default function ForgeDemo() {
  const [activeProject, setActiveProject] = useState(0);
  const [progress, setProgress] = useState(45);
  const [isExecuting, setIsExecuting] = useState(true);

  // Simulate progress
  useEffect(() => {
    if (isExecuting && progress < 99) {
      const timer = setTimeout(() => setProgress(p => Math.min(p + 1, 99)), 800);
      return () => clearTimeout(timer);
    }
  }, [progress, isExecuting]);

  const projects = [
    {
      name: 'Kindle → Anki',
      version: 'v2.0',
      devStatus: 'completed',
      runtimeStatus: 'scheduled',
      lastRun: '2h ago',
      schedule: '9am daily',
    },
    {
      name: 'QuickCapture',
      version: 'v1.0',
      devStatus: 'executing',
      progress: progress,
      total: 99,
      currentTask: '添加 Toast 通知',
    },
    {
      name: 'Daily Digest Bot',
      version: 'v1.0',
      devStatus: 'completed',
      runtimeStatus: 'running',
      uptime: '3h',
      health: 'ok',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1a1a] font-sans overflow-hidden">
      
      {/* Subtle warm gradient at top */}
      <div 
        className="fixed top-0 left-0 right-0 h-[400px] pointer-events-none opacity-60"
        style={{
          background: 'linear-gradient(180deg, rgba(251,191,36,0.04) 0%, transparent 100%)'
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-2">
            {/* Forge logo mark */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <h1 
              className="text-3xl font-light tracking-tight text-[#1a1a1a]"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Forge
            </h1>
          </div>
          <p className="text-[#737373] text-sm ml-14">
            从想法到运行，一口气完成
          </p>
        </header>

        {/* Color Palette Section */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] mb-6 font-medium">
            Color Palette
          </h2>
          <div className="flex gap-3 flex-wrap">
            {[
              { color: '#faf9f7', name: 'Background', border: true },
              { color: '#ffffff', name: 'Surface', border: true },
              { color: '#f5f5f4', name: 'Muted' },
              { color: '#e5e5e5', name: 'Border' },
              { color: '#f59e0b', name: 'Accent' },
              { color: '#16a34a', name: 'Success' },
              { color: '#dc2626', name: 'Error' },
              { color: '#1a1a1a', name: 'Text' },
              { color: '#737373', name: 'Secondary' },
            ].map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-12 h-12 rounded-lg shadow-sm ${c.border ? 'border border-[#e5e5e5]' : ''}`}
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider">{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] mb-6 font-medium">
            Typography
          </h2>
          <div className="space-y-4 bg-white rounded-2xl p-8 border border-[#e5e5e5] shadow-sm">
            <p className="text-4xl font-light tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'DM Sans', system-ui" }}>
              Kindle → Anki
            </p>
            <p className="text-xl text-[#525252]" style={{ fontFamily: "'DM Sans', system-ui" }}>
              Daily conversion of markdown notes to Anki flashcards
            </p>
            <p className="text-sm text-[#a3a3a3] font-mono">
              ~/Projects/kindle-anki
            </p>
          </div>
        </section>

        {/* Project Cards Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] font-medium">
              Project Cards
            </h2>
            <button className="group flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-150">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Project
            </button>
          </div>

          <div className="space-y-4">
            {projects.map((project, i) => (
              <ProjectCard 
                key={project.name} 
                project={project} 
                isActive={activeProject === i}
                onClick={() => setActiveProject(i)}
              />
            ))}
          </div>
        </section>

        {/* States & Indicators Section */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] mb-6 font-medium">
            Status Indicators
          </h2>
          <div className="flex flex-wrap gap-4">
            <StatusPill status="completed" label="Completed" />
            <StatusPill status="executing" label="Executing" />
            <StatusPill status="scheduled" label="Scheduled" />
            <StatusPill status="running" label="Always Running" />
            <StatusPill status="paused" label="Paused" />
            <StatusPill status="error" label="Error" />
          </div>
        </section>

        {/* Execution Panel */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] mb-6 font-medium">
            Execution Progress
          </h2>
          <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-medium text-[#1a1a1a]">QuickCapture</span>
                <span className="text-[#a3a3a3] text-sm">v1.0</span>
              </div>
              <span className="text-amber-600 text-sm font-medium">Executing</span>
            </div>
            
            {/* Progress */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#737373]">Progress</span>
                <span className="text-sm font-mono text-[#525252]">{progress}/99</span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-[#f0f0f0] rounded-full overflow-hidden mb-6">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(progress / 99) * 100}%` }}
                />
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full animate-shimmer"
                  style={{ width: `${(progress / 99) * 100}%` }}
                />
              </div>

              {/* Current task */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#a3a3a3]">Current:</span>
                <span className="font-mono text-[#525252]">046. 添加 Toast 通知</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="px-6 pb-6">
              <div className="bg-[#fafaf9] rounded-xl p-4 border border-[#f0f0f0]">
                <p className="text-xs uppercase tracking-wider text-[#a3a3a3] mb-3">Recent Activity</p>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-[#525252]">045. 实现错误边界</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-[#525252]">044. 添加加载状态</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-[#525252]">043. 创建 API hooks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => setIsExecuting(!isExecuting)}
                className="px-4 py-2 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg text-sm font-medium transition-colors text-[#525252]"
              >
                {isExecuting ? 'Pause' : 'Resume'}
              </button>
              <button className="px-4 py-2 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg text-sm font-medium transition-colors text-[#525252]">
                Open in VSCode
              </button>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] mb-6 font-medium">
            Button Styles
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all duration-150">
              Primary Action
            </button>
            <button className="px-5 py-2.5 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg font-medium transition-colors text-[#525252]">
              Secondary
            </button>
            <button className="px-5 py-2.5 rounded-lg font-medium text-amber-600 hover:bg-amber-50 transition-colors">
              Ghost
            </button>
            <button className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors">
              Destructive
            </button>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#a3a3a3] mb-6 font-medium">
            Dashboard Metrics
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard value="847" label="Cards Today" trend="+12%" />
            <MetricCard value="12" label="Books Done" />
            <MetricCard value="23s" label="Last Run" status="success" />
          </div>
        </section>

      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, isActive, onClick }) {
  const isExecuting = project.devStatus === 'executing';
  const isRunning = project.runtimeStatus === 'running';
  
  return (
    <div 
      onClick={onClick}
      className={`
        group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-sm
        ${isActive 
          ? 'border-amber-400 shadow-md shadow-amber-500/10' 
          : 'border-[#e5e5e5] hover:border-[#d4d4d4] hover:shadow-md'
        }
      `}
    >
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-medium text-[#1a1a1a]">{project.name}</h3>
              <span className="text-xs text-[#737373] font-mono bg-[#f5f5f4] px-2 py-0.5 rounded">
                {project.version}
              </span>
            </div>
          </div>
          
          {/* Status indicator */}
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Running</span>
            </div>
          )}
        </div>

        {/* Two columns: Dev & Runtime */}
        <div className="grid grid-cols-2 gap-6">
          {/* Development */}
          <div>
            <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mb-2">Development</p>
            {isExecuting ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm text-amber-600 font-medium">Executing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: `${(project.progress / project.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#a3a3a3] font-mono">{project.progress}/{project.total}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span className="text-sm text-[#525252]">Completed</span>
              </div>
            )}
          </div>

          {/* Runtime */}
          <div>
            <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mb-2">Runtime</p>
            {project.runtimeStatus === 'scheduled' && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-[#525252]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#737373]">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span>{project.schedule}</span>
                </div>
                <p className="text-xs text-[#a3a3a3] mt-1">Last run: {project.lastRun} ✓</p>
              </div>
            )}
            {project.runtimeStatus === 'running' && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="font-medium">Always Running</span>
                </div>
                <p className="text-xs text-[#a3a3a3] mt-1">Uptime: {project.uptime} • Health: OK</p>
              </div>
            )}
            {!project.runtimeStatus && (
              <span className="text-sm text-[#a3a3a3]">Not configured</span>
            )}
          </div>
        </div>

        {/* Actions (shown on hover) */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#f0f0f0] opacity-0 group-hover:opacity-100 transition-opacity">
          {project.devStatus === 'completed' && (
            <>
              <button className="text-xs px-3 py-1.5 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#525252]">
                Iterate
              </button>
              <button className="text-xs px-3 py-1.5 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#525252]">
                VSCode
              </button>
            </>
          )}
          {isExecuting && (
            <button className="text-xs px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors font-medium">
              View Progress
            </button>
          )}
          {project.runtimeStatus && (
            <>
              <button className="text-xs px-3 py-1.5 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#525252]">
                Dashboard
              </button>
              <button className="text-xs px-3 py-1.5 bg-[#f5f5f4] hover:bg-[#e5e5e5] rounded-lg transition-colors text-[#525252]">
                Logs
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Status Pill Component
function StatusPill({ status, label }) {
  const styles = {
    completed: 'bg-green-50 text-green-700 border-green-200',
    executing: 'bg-amber-50 text-amber-700 border-amber-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    running: 'bg-green-50 text-green-700 border-green-200',
    paused: 'bg-gray-100 text-gray-600 border-gray-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  const icons = {
    completed: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>,
    executing: <div className="w-2 h-2 rounded-full bg-current animate-pulse" />,
    scheduled: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    running: <div className="w-2 h-2 rounded-full bg-current animate-pulse" />,
    paused: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    error: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>,
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {label}
    </div>
  );
}

// Metric Card Component
function MetricCard({ value, label, trend, status }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#e5e5e5] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-end justify-between mb-1">
        <span className="text-3xl font-light tracking-tight text-[#1a1a1a]">{value}</span>
        {trend && (
          <span className="text-xs text-green-600 font-medium">{trend}</span>
        )}
        {status === 'success' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </div>
      <p className="text-xs text-[#a3a3a3] uppercase tracking-wider">{label}</p>
    </div>
  );
}