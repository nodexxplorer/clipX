// frontend/src/components/admin/common/ImageUpload.jsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';

export default function ImageUpload({ value, onChange, label }) {
  const [preview, setPreview] = useState(value);

  const onDrop = useCallback((files) => {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
        onChange(file);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  return (
    <div>
      {label && <label className="block text-gray-400 mb-2 text-sm">{label}</label>}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 hover:border-gray-600'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-40 rounded" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview(null); onChange(null); }}
              className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full"
            >
              <FiX size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="text-gray-400">
            <FiImage size={40} className="mx-auto mb-2" />
            <p>{isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}</p>
          </div>
        )}
      </div>
    </div>
  );
}