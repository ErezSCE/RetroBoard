import React from 'react';
import { act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColumnList from './ColumnList';
import axios from 'axios';

jest.mock('axios');

describe('ColumnList component', () => {
  const sessionId = 1;
  const initialColumns = [
    { id: 1, title: 'To Do', position: 0 },
    { id: 2, title: 'In Progress', position: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays columns on mount', async () => {
    axios.get.mockResolvedValueOnce({ data: initialColumns });

    await act(async () => {
      render(<ColumnList sessionId={sessionId} />);
    });

    expect(axios.get).toHaveBeenCalledWith('/columns', { params: { sessionId } });

    // Wait for columns to be rendered
    const items = await screen.findAllByTestId('column-item');
    expect(items).toHaveLength(initialColumns.length);
    expect(screen.getByDisplayValue('To Do')).toBeInTheDocument();
    expect(screen.getByDisplayValue('In Progress')).toBeInTheDocument();
  });

  test('adds a new column', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    const newColumn = { id: 3, title: 'Done', position: 2 };
    axios.post.mockResolvedValueOnce({ data: newColumn });

    render(<ColumnList sessionId={sessionId} />);

    const input = await screen.findByTestId('new-column-input');
    fireEvent.change(input, { target: { value: 'Done' } });
    const addBtn = screen.getByTestId('add-button');
    fireEvent.click(addBtn);

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/columns', {
      sessionId: Number(sessionId),
      title: 'Done',
    }));

    const items = await screen.findAllByTestId('column-item');
    expect(items).toHaveLength(1);
    expect(screen.getByDisplayValue('Done')).toBeInTheDocument();
  });

  test('renames a column on blur', async () => {
    axios.get.mockResolvedValueOnce({ data: initialColumns });
    axios.put.mockResolvedValueOnce({ data: { ...initialColumns[0], title: 'Backlog' } });

    render(<ColumnList sessionId={sessionId} />);

    const input = await screen.findByDisplayValue('To Do');
    fireEvent.change(input, { target: { value: 'Backlog' } });
    fireEvent.blur(input);

    await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/columns/1', { title: 'Backlog' }));
    expect(screen.getByDisplayValue('Backlog')).toBeInTheDocument();
  });

  test('deletes a column without cards', async () => {
    axios.get.mockResolvedValueOnce({ data: initialColumns });
    axios.delete.mockResolvedValueOnce({ status: 204 });

    render(<ColumnList sessionId={sessionId} />);

    const deleteButtons = await screen.findAllByTestId('delete-button');
    fireEvent.click(deleteButtons[0]); // delete first column

    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/columns/1'));
    const items = screen.queryAllByTestId('column-item');
    expect(items).toHaveLength(initialColumns.length - 1);
  });

  test('shows confirmation when column contains cards and deletes after confirm', async () => {
    axios.get.mockResolvedValueOnce({ data: initialColumns });
    // First delete attempt fails with 400
    const error = { response: { status: 400 } };
    axios.delete.mockRejectedValueOnce(error);
    // After confirmation, second delete succeeds
    axios.delete.mockResolvedValueOnce({ status: 204 });

    // Mock confirm dialog button click
    // No need to mock window.confirm as component uses ConfirmDialog

    render(<ColumnList sessionId={sessionId} />);

    const deleteButtons = await screen.findAllByTestId('delete-button');
    fireEvent.click(deleteButtons[0]);

    // Wait for confirm dialog and click confirm button
await waitFor(() => expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument());
const confirmBtn = screen.getByTestId('confirm-delete-button');
fireEvent.click(confirmBtn);
    // Wait for delete calls to complete and dialog to disappear
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
    const items = screen.queryAllByTestId('column-item');
    expect(items).toHaveLength(initialColumns.length - 1);


  });
});
