import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Card, { CardProps } from '../src/components/Card';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Card component', () => {
  const baseProps: CardProps = {
    id: 1,
    content: 'Initial feedback',
    authorName: 'Alice',
    onDelete: jest.fn(),
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders content and author name', () => {
    const { getByTestId } = render(<Card {...baseProps} />);
    expect(getByTestId('card-content')).toHaveTextContent('Initial feedback');
    expect(getByTestId('card-author')).toHaveTextContent('Alice');
  });

  it('shows "Anonymous" when authorName is missing or empty', () => {
    const { getByTestId, rerender } = render(<Card {...baseProps} authorName={undefined} />);
    expect(getByTestId('card-author')).toHaveTextContent('Anonymous');

    rerender(<Card {...baseProps} authorName="   " />);
    expect(getByTestId('card-author')).toHaveTextContent('Anonymous');
  });

  it('calls onDelete after successful delete API call', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});
    const { getByTestId } = render(<Card {...baseProps} />);
    fireEvent.click(getByTestId('delete-button'));
    await waitFor(() => expect(mockedAxios.delete).toHaveBeenCalledWith('/cards/1'));
    expect(baseProps.onDelete).toHaveBeenCalledWith(1);
  });

  it('allows editing and calls onUpdate with API response', async () => {
    const updatedData = { id: 1, content: 'Updated feedback', authorName: 'Bob' };
    mockedAxios.put.mockResolvedValueOnce({ data: updatedData });

    const { getByTestId, queryByTestId } = render(<Card {...baseProps} />);

    // Enter edit mode
    fireEvent.click(getByTestId('edit-button'));
    expect(getByTestId('edit-content')).toBeInTheDocument();

    // Change content and author
    fireEvent.change(getByTestId('edit-content'), { target: { value: 'Updated feedback' } });
    fireEvent.change(getByTestId('edit-author'), { target: { value: 'Bob' } });

    // Save changes
    fireEvent.click(getByTestId('save-button'));

    await waitFor(() => expect(mockedAxios.put).toHaveBeenCalledWith('/cards/1', {
      content: 'Updated feedback',
      authorName: 'Bob',
    }));
    expect(baseProps.onUpdate).toHaveBeenCalledWith(updatedData);
    // After save, edit fields should disappear
    expect(queryByTestId('edit-content')).not.toBeInTheDocument();
  });
});
