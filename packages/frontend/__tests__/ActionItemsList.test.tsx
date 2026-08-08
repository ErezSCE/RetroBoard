import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ActionItemsList from '../src/components/ActionItemsList';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ActionItemsList component', () => {
  const sessionId = 1;
  const mockItems = [
    {
      id: 10,
      sessionId,
      source_type: 'card',
      source_id: 5,
      title: 'Fix login bug',
      ownerParticipantId: 2,
      due_date: '2023-12-31',
      status: 'open',
    },
    {
      id: 11,
      sessionId,
      source_type: 'cluster',
      source_id: 3,
      title: 'Prepare report',
      ownerParticipantId: null,
      due_date: null,
      status: 'open',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays action items on mount', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockItems });

    render(<ActionItemsList sessionId={sessionId} />);

    expect(mockedAxios.get).toHaveBeenCalledWith('/action-items', { params: { sessionId } });

    // Wait for items to appear
    const firstItem = await screen.findByText(/Fix login bug/);
    expect(firstItem).toBeInTheDocument();
    expect(screen.getByText(/Prepare report/)).toBeInTheDocument();
    // Owner and due date should be rendered
    expect(screen.getByText(/Owner: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Due: 2023-12-31/)).toBeInTheDocument();
  });

  it('marks an item as done and updates UI on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockItems });
    const updatedItem = { ...mockItems[0], status: 'closed' };
    mockedAxios.put.mockResolvedValueOnce({ data: updatedItem });

    render(<ActionItemsList sessionId={sessionId} />);

    // Wait for list to render
    await screen.findByText(/Fix login bug/);
    const button = screen.getByTestId('mark-done-button-10');
    fireEvent.click(button);

    await waitFor(() => expect(mockedAxios.put).toHaveBeenCalledWith('/action-items/10', { status: 'closed' }));
    // After successful update, status should be reflected (e.g., button disabled or text shows Done)
    expect(button).toBeDisabled();
    expect(screen.getByText(/Status: closed/)).toBeInTheDocument();
  });

  it('shows error message when marking as done fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockItems });
    mockedAxios.put.mockRejectedValueOnce({ response: { status: 500, data: { error: 'Server error' } } });

    render(<ActionItemsList sessionId={sessionId} />);

    await screen.findByText(/Fix login bug/);
    const button = screen.getByTestId('mark-done-button-10');
    fireEvent.click(button);

    await waitFor(() => expect(mockedAxios.put).toHaveBeenCalled());
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Server error');
    // Button should remain enabled
    expect(button).toBeEnabled();
  });
});
