// frontend/src/components/admin/dashboard/TopMoviesTable.jsx
export default function TopMoviesTable({ movies = [] }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Top Movies</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
              <th className="pb-3">Movie</th>
              <th className="pb-3 text-right">Views</th>
              <th className="pb-3 text-right">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {movies.slice(0, 5).map((item, i) => (
              <tr key={i} className="border-b border-gray-700/50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.movie?.posterUrl || '/placeholder.jpg'} 
                      alt={item.movie?.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <span className="text-white text-sm">{item.movie?.title}</span>
                  </div>
                </td>
                <td className="text-right text-gray-300">{item.views?.toLocaleString()}</td>
                <td className="text-right text-gray-300">{item.downloads?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}