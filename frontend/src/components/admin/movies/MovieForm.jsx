// Admin Movie Form Component
import { useState } from 'react';
import styles from './MovieForm.module.css';

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

export default function MovieForm({ onSubmit, loading, initialData = {} }) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    overview: initialData.overview || '',
    posterUrl: initialData.posterUrl || '',
    backdropUrl: initialData.backdropUrl || '',
    trailerUrl: initialData.trailerUrl || '',
    releaseDate: initialData.releaseDate || '',
    runtime: initialData.runtime || '',
    rating: initialData.rating || '',
    genres: initialData.genres || [],
    tagline: initialData.tagline || '',
    contentType: initialData.contentType || 'movie',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleGenre = (genre) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      runtime: form.runtime ? parseInt(form.runtime) : null,
      rating: form.rating ? parseFloat(form.rating) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="movie-form">
      <style jsx>{`
        .movie-form { display: grid; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { color: #d1d5db; font-size: 13px; font-weight: 600; }
        .form-group input, .form-group textarea, .form-group select {
          padding: 12px 16px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          color: #fff; font-size: 14px; outline: none; font-family: inherit;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
          border-color: #3b82f6;
        }
        .form-group textarea { resize: vertical; min-height: 100px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .genre-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .genre-chip {
          padding: 6px 14px; border-radius: 20px; font-size: 13px;
          cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #9ca3af;
        }
        .genre-chip.active {
          background: rgba(59,130,246,0.2); border-color: #3b82f6; color: #60a5fa;
        }
        .genre-chip:hover { border-color: rgba(255,255,255,0.2); }
        .submit-btn {
          padding: 14px 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff; border: none; border-radius: 12px; font-weight: 700;
          font-size: 15px; cursor: pointer; transition: opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; }
        .preview-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 16px; display: flex; gap: 16px;
        }
        .preview-poster {
          width: 100px; height: 150px; border-radius: 8px; object-fit: cover;
          background: rgba(255,255,255,0.05);
        }
        .preview-info { flex: 1; }
        .preview-info h3 { color: #fff; font-size: 16px; margin: 0 0 4px; }
        .preview-info p { color: #6b7280; font-size: 13px; margin: 0; }
      `}</style>

      {/* Title & Type */}
      <div className="form-row">
        <div className="form-group">
          <label>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Movie title" required />
        </div>
        <div className="form-group">
          <label>Content Type</label>
          <select name="contentType" value={form.contentType} onChange={handleChange}>
            <option value="movie">Movie</option>
            <option value="series">Series</option>
            <option value="documentary">Documentary</option>
          </select>
        </div>
      </div>

      {/* Tagline */}
      <div className="form-group">
        <label>Tagline</label>
        <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="A short catchy tagline..." />
      </div>

      {/* Overview */}
      <div className="form-group">
        <label>Overview</label>
        <textarea name="overview" value={form.overview} onChange={handleChange} placeholder="Movie description / synopsis..." rows={4} />
      </div>

      {/* URLs */}
      <div className="form-row">
        <div className="form-group">
          <label>Poster URL</label>
          <input name="posterUrl" value={form.posterUrl} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label>Backdrop URL</label>
          <input name="backdropUrl" value={form.backdropUrl} onChange={handleChange} placeholder="https://..." />
        </div>
      </div>

      <div className="form-group">
        <label>Trailer URL</label>
        <input name="trailerUrl" value={form.trailerUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
      </div>

      {/* Metadata */}
      <div className="form-row-3">
        <div className="form-group">
          <label>Release Date</label>
          <input type="date" name="releaseDate" value={form.releaseDate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Runtime (min)</label>
          <input type="number" name="runtime" value={form.runtime} onChange={handleChange} placeholder="120" min="0" />
        </div>
        <div className="form-group">
          <label>Rating (0-10)</label>
          <input type="number" name="rating" value={form.rating} onChange={handleChange} placeholder="7.5" min="0" max="10" step="0.1" />
        </div>
      </div>

      {/* Genres */}
      <div className="form-group">
        <label>Genres ({form.genres.length} selected)</label>
        <div className="genre-grid">
          {GENRE_OPTIONS.map(g => (
            <span key={g} className={`genre-chip ${form.genres.includes(g) ? 'active' : ''}`} onClick={() => toggleGenre(g)}>
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Preview */}
      {form.title && (
        <div className="preview-card">
          {form.posterUrl ? (
            <img className="preview-poster" src={form.posterUrl} alt="poster" />
          ) : (
            <div className="preview-poster" />
          )}
          <div className="preview-info">
            <h3>{form.title}</h3>
            <p>{form.contentType} · {form.releaseDate || 'TBD'} · {form.runtime ? `${form.runtime} min` : 'Unknown'}</p>
            <p style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
              {form.genres.join(', ') || 'No genres'}
            </p>
            {form.tagline && <p style={{ marginTop: 8, fontStyle: 'italic', color: '#d1d5db' }}>"{form.tagline}"</p>}
          </div>
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={loading || !form.title.trim()}>
        {loading ? 'Creating...' : '✨ Create Movie'}
      </button>
    </form>
  );
}
