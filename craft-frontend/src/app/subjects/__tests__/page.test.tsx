import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@/__tests__/test-utils';
import SubjectsPage from '../page';
import { mockApiClient, mockApiResponse, mockSubject } from '@/__tests__/test-utils';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: mockApiClient,
}));

// Mock next navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/subjects',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('SubjectsPage', () => {
  const mockSubjects = [
    { ...mockSubject, id: '1', displayName: 'Subject 1' },
    { ...mockSubject, id: '2', displayName: 'Subject 2' },
    { ...mockSubject, id: '3', displayName: 'Subject 3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue(
      mockApiResponse(mockSubjects, true)
    );
  });

  describe('Rendering', () => {
    it('renders the subjects page', async () => {
      render(<SubjectsPage />);
      
      expect(screen.getByRole('heading', { name: 'Subjects' })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
        expect(screen.getByText('Subject 2')).toBeInTheDocument();
        expect(screen.getByText('Subject 3')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<SubjectsPage />);
      
      expect(screen.getByText('Loading subjects...')).toBeInTheDocument();
    });

    it('renders subjects table with proper columns', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Subject')).toBeInTheDocument();
        expect(screen.getByText('Policies')).toBeInTheDocument();
        expect(screen.getByText('Created By')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('displays subject information correctly', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<SubjectsPage />);
      
      expect(screen.getByPlaceholderText(/Search subjects/i)).toBeInTheDocument();
    });

    it('filters subjects on search input', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search subjects/i);
      fireEvent.change(searchInput, { target: { value: 'Subject 1' } });

      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
        expect(screen.queryByText('Subject 2')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search subjects/i);
      fireEvent.change(searchInput, { target: { value: 'NonexistentSubject' } });

      await waitFor(() => {
        expect(screen.getByText('No subjects found')).toBeInTheDocument();
      });
    });

    it('clears search properly', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search subjects/i);
      fireEvent.change(searchInput, { target: { value: 'Subject 1' } });

      await waitFor(() => {
        expect(screen.queryByText('Subject 2')).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
        expect(screen.getByText('Subject 2')).toBeInTheDocument();
      });
    });
  });

  describe('Create Subject', () => {
    it('renders create subject button for admin users', () => {
      render(<SubjectsPage />);
      
      expect(screen.getByRole('button', { name: /Add Subject/i })).toBeInTheDocument();
    });

    it('does not render create button for basic users', () => {
      render(
        <SubjectsPage />,
        {
          authValue: {
            user: { ...mockSubject, role: 'Basic' },
            isAuthenticated: true,
          }
        }
      );
      
      expect(screen.queryByRole('button', { name: /Add Subject/i })).not.toBeInTheDocument();
    });

    it('opens create dialog when button is clicked', () => {
      render(<SubjectsPage />);
      
      const createButton = screen.getByRole('button', { name: /Add Subject/i });
      fireEvent.click(createButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add New Subject')).toBeInTheDocument();
    });

    it('creates new subject successfully', async () => {
      mockApiClient.post.mockResolvedValue(mockApiResponse(mockSubject));
      
      render(<SubjectsPage />);
      
      const createButton = screen.getByRole('button', { name: /Add Subject/i });
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/Name/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      
      fireEvent.change(nameInput, { target: { value: 'New Subject' } });
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          displayName: 'New Subject',
          description: 'New Description',
        }));
      });
    });

    it('handles create subject error', async () => {
      mockApiClient.post.mockResolvedValue(mockApiResponse(null, false));
      
      render(<SubjectsPage />);
      
      const createButton = screen.getByRole('button', { name: /Add Subject/i });
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Subject' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to create subject/i)).toBeInTheDocument();
      });
    });
  });

  describe('Subject Actions', () => {
    it('renders view, edit, and delete buttons for admin users', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const actionButtons = screen.getAllByRole('button');
        const viewButtons = actionButtons.filter(btn => btn.getAttribute('aria-label')?.includes('View'));
        const editButtons = actionButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Edit'));
        const deleteButtons = actionButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Delete'));
        
        expect(viewButtons.length).toBeGreaterThan(0);
        expect(editButtons.length).toBeGreaterThan(0);
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it('only renders view button for basic users', async () => {
      render(
        <SubjectsPage />,
        {
          authValue: {
            user: { ...mockSubject, role: 'Basic' },
            isAuthenticated: true,
          }
        }
      );
      
      await waitFor(() => {
        const actionButtons = screen.getAllByRole('button');
        const viewButtons = actionButtons.filter(btn => btn.getAttribute('aria-label')?.includes('View'));
        const editButtons = actionButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Edit'));
        const deleteButtons = actionButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Delete'));
        
        expect(viewButtons.length).toBeGreaterThan(0);
        expect(editButtons).toHaveLength(0);
        expect(deleteButtons).toHaveLength(0);
      });
    });

    it('opens view dialog when view button is clicked', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const viewButton = screen.getAllByRole('button').find(btn => 
          btn.getAttribute('aria-label')?.includes('View')
        );
        if (viewButton) {
          fireEvent.click(viewButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Subject Details')).toBeInTheDocument();
      });
    });

    it('opens edit dialog when edit button is clicked', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const editButton = screen.getAllByRole('button').find(btn => 
          btn.getAttribute('aria-label')?.includes('Edit')
        );
        if (editButton) {
          fireEvent.click(editButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Subject')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Subject', () => {
    it('opens delete confirmation dialog', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getAllByRole('button').find(btn => 
          btn.getAttribute('aria-label')?.includes('Delete')
        );
        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete Subject')).toBeInTheDocument();
      });
    });

    it('deletes subject successfully', async () => {
      mockApiClient.delete.mockResolvedValue(mockApiResponse(null));
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getAllByRole('button').find(btn => 
          btn.getAttribute('aria-label')?.includes('Delete')
        );
        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/subjects/1');
      });
    });

    it('handles delete error with validation error', async () => {
      mockApiClient.delete.mockResolvedValue(
        mockApiResponse(null, false, 'Cannot delete subject. It is currently used in 2 active policies: Policy A, Policy B')
      );
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getAllByRole('button').find(btn => 
          btn.getAttribute('aria-label')?.includes('Delete')
        );
        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Cannot delete subject/)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('enables bulk mode when subjects are selected', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        if (checkboxes.length > 1) {
          fireEvent.click(checkboxes[1]); // First subject checkbox
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete Selected/i })).toBeInTheDocument();
      });
    });

    it('selects all subjects with header checkbox', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const headerCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(headerCheckbox);
      });
      
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
      });
    });

    it('performs bulk delete', async () => {
      mockApiClient.delete.mockResolvedValue(mockApiResponse(null));
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const headerCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(headerCheckbox);
      });
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /Delete Selected/i });
        fireEvent.click(deleteButton);
      });
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledTimes(3); // All subjects deleted
      });
    });
  });

  describe('Sorting', () => {
    it('sorts subjects by name when column header is clicked', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const subjectHeader = screen.getByText('Subject');
        fireEvent.click(subjectHeader);
      });
      
      // Should trigger sorting
      expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
        sortBy: 'name',
        sortOrder: 'asc',
      }));
    });

    it('toggles sort direction on repeated clicks', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const subjectHeader = screen.getByText('Subject');
        fireEvent.click(subjectHeader);
        fireEvent.click(subjectHeader);
      });
      
      expect(mockApiClient.get).toHaveBeenLastCalledWith('/subjects', expect.objectContaining({
        sortBy: 'name',
        sortOrder: 'desc',
      }));
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      });
    });

    it('changes page when pagination is used', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        if (nextButton && !nextButton.disabled) {
          fireEvent.click(nextButton);
        }
      });
      
      // Should call API with new page
      expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
        page: 2,
      }));
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load subjects/i)).toBeInTheDocument();
      });
    });

    it('displays empty state when no subjects exist', async () => {
      mockApiClient.get.mockResolvedValue(mockApiResponse([]));
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No subjects found')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    it('refreshes data when window gains focus', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });
      
      // Simulate window focus
      fireEvent.focus(window);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('rowgroup')).toBeInTheDocument(); // thead or tbody
      });
    });

    it('has proper button labels', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Add Subject')).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /Add Subject/i });
        createButton.focus();
        expect(createButton).toHaveFocus();
      });
    });
  });
});