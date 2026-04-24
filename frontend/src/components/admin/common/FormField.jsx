// frontend/src/components/admin/common/FormField.jsx
export default function FormField({
  label, name, value, onChange, type = 'text', placeholder, required,
  hint, error, rows, options, disabled, className = ''
}) {
  const baseInput = `w-full bg-white/5 border text-white text-sm px-4 py-2.5 rounded-xl outline-none
    transition-colors placeholder-gray-600 font-[inherit]
    ${error ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/10 focus:border-primary-500/30'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={name} name={name} value={value} onChange={handleChange}
          placeholder={placeholder} required={required} disabled={disabled}
          rows={rows || 3} className={`${baseInput} resize-none`}
        />
      ) : type === 'select' ? (
        <select
          id={name} name={name} value={value} onChange={handleChange}
          required={required} disabled={disabled}
          className={`${baseInput} cursor-pointer`}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={name} name={name} type={type} value={value} onChange={handleChange}
          placeholder={placeholder} required={required} disabled={disabled}
          className={baseInput}
        />
      )}

      {hint && !error && <p className="text-[11px] text-gray-600">{hint}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
