import React from 'react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div data-testid="confirm-dialog" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '4px' }}>
        <p>{message}</p>
        <button onClick={onConfirm} data-testid="confirm-delete-button">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-delete-button">Cancel</button>
      </div>
    </div>
  );
}
