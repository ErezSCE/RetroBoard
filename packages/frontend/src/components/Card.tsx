import React, { useState } from 'react';
import axios from 'axios';

export interface CardProps {
  /**
   * Card identifier as returned by the backend.
   */
  id: number | string;
  /**
   * Short text displayed on the card.
   */
  content: string;
  /**
   * Optional author name. If omitted, the UI shows "Anonymous".
   */
  authorName?: string;
  /**
   * Callback invoked after a successful delete. Parent components can remove the card from their state.
   */
  onDelete?: (id: number | string) => void;
  /**
   * Callback invoked after a successful update (edit). Receives the updated card data.
   */
  onUpdate?: (updatedCard: { id: number | string; content: string; authorName?: string }) => void;
}

/**
 * Card component – displays a retro board card with author information and edit/delete actions.
 *
 * The component follows the "optimistic UI" pattern used elsewhere in the codebase:
 *   * UI updates immediately after a successful API call.
 *   * Errors are logged to the console – higher‑level error handling is out of scope for this component.
 */
export default function Card({ id, content, authorName, onDelete, onUpdate }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editAuthor, setEditAuthor] = useState(authorName ?? '');

  const displayedAuthor = authorName?.trim() ? authorName : 'Anonymous';

  const handleDelete = async () => {
    try {
      await axios.delete(`/cards/${id}`);
      if (onDelete) onDelete(id);
    } catch (err) {
      // In a real app we would surface this to the user.
      console.error('Failed to delete card', err);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        content: editContent.trim(),
        authorName: editAuthor.trim() || undefined,
      };
      const res = await axios.put(`/cards/${id}`, payload);
      // Backend returns the updated card; we forward it to the parent.
      if (onUpdate) onUpdate(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update card', err);
    }
  };

  return (
    <div data-testid="card" style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '8px' }}>
      {isEditing ? (
        <div>
          <textarea
            data-testid="edit-content"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />
          <input
            data-testid="edit-author"
            type="text"
            placeholder="Author (optional)"
            value={editAuthor}
            onChange={(e) => setEditAuthor(e.target.value)}
            style={{ width: '100%', marginTop: '4px' }}
          />
          <button data-testid="save-button" onClick={handleSave} style={{ marginTop: '4px' }}>
            Save
          </button>
          <button data-testid="cancel-button" onClick={() => setIsEditing(false)} style={{ marginLeft: '4px' }}>
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <p data-testid="card-content">{content}</p>
          <small data-testid="card-author">{displayedAuthor}</small>
          <div style={{ marginTop: '4px' }}>
            <button data-testid="edit-button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button data-testid="delete-button" onClick={handleDelete} style={{ marginLeft: '4px' }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
