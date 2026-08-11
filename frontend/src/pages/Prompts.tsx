import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { HuntItem } from '../types';

export default function Prompts() {
  const [items, setItems] = useState<HuntItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getItems()
      .then(data => {
        // Sort items by points descending, just to make it easy to see the big ticket items
        const sorted = data.sort((a, b) => b.points - a.points);
        setItems(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading prompts...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight">Available Prompts</h1>
        <Link to="/" className="text-blue-600 hover:underline font-medium">&larr; Leaderboard</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
              {item.description && (
                <p className="text-gray-600 text-sm mt-2">{item.description}</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="inline-block bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                {item.points} Points
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}