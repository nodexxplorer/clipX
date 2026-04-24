// frontend/src/components/admin/common/DateRangePicker.jsx
import { useState } from 'react';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last year', days: 365 },
  { label: 'All time', days: 0 },
];

export default function DateRangePicker({ startDate, endDate, onChange, presets = PRESETS }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('preset'); // 'preset' | 'custom'

  const activePreset = presets.find(p => {
    if (!startDate || p.days === 0) return p.days === 0 && !startDate;
    const diff = Math.round((new Date() - new Date(startDate)) / 86400000);
    return Math.abs(diff - p.days) < 2;
  });

  const handlePreset = (days) => {
    if (days === 0) {
      onChange?.({ startDate: null, endDate: null });
    } else {
      const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];
      onChange?.({ startDate: start, endDate: end });
    }
    setOpen(false);
  };

  const formatDisplay = () => {
    if (activePreset) return activePreset.label;
    if (startDate && endDate) return `${startDate} — ${endDate}`;
    return 'Select range';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-gray-300 hover:bg-white/[0.06] transition-all"
      >
        <FiCalendar size={14} className="text-gray-500" />
        <span>{formatDisplay()}</span>
        <FiChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-[#1a1c24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setMode('preset')}
                className={`flex-1 text-xs font-bold py-2.5 transition-colors ${mode === 'preset' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-500'}`}
              >
                Presets
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`flex-1 text-xs font-bold py-2.5 transition-colors ${mode === 'custom' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-500'}`}
              >
                Custom
              </button>
            </div>

            <div className="p-3">
              {mode === 'preset' ? (
                <div className="space-y-1">
                  {presets.map((p) => (
                    <button
                      key={p.days}
                      onClick={() => handlePreset(p.days)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activePreset?.days === p.days
                          ? 'bg-primary-500/10 text-primary-400 font-semibold'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start</label>
                    <input
                      type="date"
                      value={startDate || ''}
                      onChange={(e) => onChange?.({ startDate: e.target.value, endDate })}
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-primary-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">End</label>
                    <input
                      type="date"
                      value={endDate || ''}
                      onChange={(e) => onChange?.({ startDate, endDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-primary-500/30"
                    />
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
