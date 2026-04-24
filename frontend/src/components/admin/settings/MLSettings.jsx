// frontend/src/components/admin/settings/MLSettings.jsx
import { useState } from 'react';
import FormField from '../common/FormField';
import { FiCpu, FiSave, FiRefreshCw } from 'react-icons/fi';

export default function MLSettings({ settings = {}, onSave, onRetrain, loading, retraining }) {
  const [form, setForm] = useState({
    recommendationModel: settings.recommendationModel || 'collaborative',
    minInteractions: settings.minInteractions || 5,
    similarityThreshold: settings.similarityThreshold || 0.3,
    maxRecommendations: settings.maxRecommendations || 20,
    enablePersonalization: settings.enablePersonalization !== false,
    enableTrending: settings.enableTrending !== false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <FiCpu size={15} className="text-primary-400" /> ML & Recommendations
      </h2>

      <FormField label="Model Type" name="recommendationModel" type="select" value={form.recommendationModel} onChange={handleChange}
        options={[
          { value: 'collaborative', label: 'Collaborative Filtering' },
          { value: 'content', label: 'Content-Based' },
          { value: 'hybrid', label: 'Hybrid (Recommended)' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Min Interactions" name="minInteractions" type="number" value={form.minInteractions} onChange={handleChange} hint="Min user interactions before personalization" />
        <FormField label="Max Recommendations" name="maxRecommendations" type="number" value={form.maxRecommendations} onChange={handleChange} />
      </div>

      <FormField label="Similarity Threshold" name="similarityThreshold" type="number" value={form.similarityThreshold} onChange={handleChange}
        hint="Cosine similarity cutoff (0.0 - 1.0)" />

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all">
          <div>
            <p className="text-sm font-medium text-white">Personalization</p>
            <p className="text-[11px] text-gray-500">Use watch history for recommendations</p>
          </div>
          <input type="checkbox" name="enablePersonalization" checked={form.enablePersonalization} onChange={handleChange}
            className="w-10 h-6 rounded-full appearance-none bg-white/10 checked:bg-primary-500 transition-colors cursor-pointer relative
            before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1
            checked:before:translate-x-4 before:transition-transform" />
        </label>
        <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all">
          <div>
            <p className="text-sm font-medium text-white">Trending Boost</p>
            <p className="text-[11px] text-gray-500">Boost currently trending content in results</p>
          </div>
          <input type="checkbox" name="enableTrending" checked={form.enableTrending} onChange={handleChange}
            className="w-10 h-6 rounded-full appearance-none bg-white/10 checked:bg-primary-500 transition-colors cursor-pointer relative
            before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1
            checked:before:translate-x-4 before:transition-transform" />
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={() => onSave?.(form)} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
          <FiSave size={15} /> {loading ? 'Saving...' : 'Save Settings'}
        </button>
        <button onClick={onRetrain} disabled={retraining} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors border border-white/5">
          <FiRefreshCw size={15} className={retraining ? 'animate-spin' : ''} />
          {retraining ? 'Training...' : 'Retrain Model'}
        </button>
      </div>
    </div>
  );
}
