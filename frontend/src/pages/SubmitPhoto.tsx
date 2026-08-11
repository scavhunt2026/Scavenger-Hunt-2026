import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import type { HuntItem, Team } from '../types';

// TODO: Replace these with your actual Cloudinary settings

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error("Missing Cloudinary environment variables!");
}

export default function SubmitPhoto() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [items, setItems] = useState<HuntItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    Promise.all([api.getTeam(Number(teamId)), api.getItems()])
      .then(([teamData, itemsData]) => {
        setTeam(teamData);
        setItems(itemsData);
      })
      .catch(() => setError('Failed to load required data.'))
      .finally(() => setLoading(false));
  }, [teamId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const toggleItem = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please select a photo to upload.');
    if (selectedItems.length === 0) return setError('Please select at least one item you are claiming.');
    if (!teamId) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Upload image directly to Cloudinary via basic FormData fetch
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!cloudinaryRes.ok) throw new Error('Failed to upload image to Cloudinary.');
      const cloudinaryData = await cloudinaryRes.json();
      const secureUrl = cloudinaryData.secure_url;

      // 2. Submit the Cloudinary URL and claims to FastAPI backend
      await api.createSubmission(Number(teamId), secureUrl, selectedItems);
      
      // 3. Head back to the team page on success
      navigate(`/teams/${teamId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading form...</div>;
  if (!team) return <div className="p-8 text-center text-red-600">Team not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link to={`/teams/${teamId}`} className="text-blue-600 hover:underline">&larr; Back to {team.name}</Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Submit a Photo</h1>
      <p className="text-gray-600 mb-6">Uploading for team: <span className="font-semibold text-gray-900">{team.name}</span></p>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Selection */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Capture or Choose Photo</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreview && (
            <div className="mt-4 border rounded-lg overflow-hidden max-h-64 bg-gray-100 flex justify-center">
              <img src={imagePreview} alt="Preview" className="object-contain max-h-64" />
            </div>
          )}
        </div>

        {/* Item Selection list */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Which items are in this photo?</label>
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-2">
            {items.map(item => (
              <label key={item.id} className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 text-sm">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    {item.description && <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">+{item.points} pts</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg font-bold text-white shadow-sm transition-colors
            ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {submitting ? 'Uploading to Cloud & Submitting...' : 'Upload Submission'}
        </button>
      </form>
    </div>
  );
}