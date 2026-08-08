import React, { useState, FormEvent } from 'react';
import axios from 'axios';

interface CreateSessionResponse {
  url: string;
}

const CreateSession: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title,
        description,
        scheduled_at: date,
      };
      const response = await axios.post<CreateSessionResponse>('/sessions', payload);
      setShareUrl(response.data.url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Optionally show a toast; omitted for brevity
      } catch (e) {
        // ignore copy errors
      }
    }
  };

  return (
    <div>
      <h2>Create Retro Session</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="date">Date & Time</label>
          <input
            id="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Creating...' : 'Create Session'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {shareUrl && (
        <div>
          <p>Shareable URL:</p>
          <code>{shareUrl}</code>
          <button onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div>
  );
};

export default CreateSession;
