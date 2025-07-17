import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntegrationCard } from '@/components/integrations-framework/IntegrationCard';
import { IntegrationManager } from '@/components/integrations-framework/IntegrationManager';
import { OAuthCallback } from '@/components/integrations-framework/OAuthCallback';
import { IntegrationMonitor } from '@/components/integrations-framework/IntegrationMonitor';
import { mockIntegrationConfig, mockIntegrationConnection } from '../fixtures/mock-integrations';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()]
}));

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

describe('Integration Framework Components', () => {
  describe('IntegrationCard Component', () => {
    test('should render integration card with basic information', () => {
      render(
        <IntegrationCard
          integration={mockIntegrationConfig}
          onConnect={vi.fn()}
        />
      );

      expect(screen.getByText('Zoom')).toBeInTheDocument();
      expect(screen.getByText('Video conferencing and webinar platform')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });

    test('should show connect button when not connected', () => {
      render(
        <IntegrationCard
          integration={mockIntegrationConfig}
          onConnect={vi.fn()}
        />
      );

      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    test('should show connected status when integration is connected', () => {
      render(
        <IntegrationCard
          integration={mockIntegrationConfig}
          connection={mockIntegrationConnection}
          onDisconnect={vi.fn()}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    test('should call onConnect when connect button is clicked', async () => {
      const onConnect = vi.fn();
      
      render(
        <IntegrationCard
          integration={mockIntegrationConfig}
          onConnect={onConnect}
        />
      );

      fireEvent.click(screen.getByText('Connect'));

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalledWith('zoom');
      });
    });

    test('should call onDisconnect when disconnect button is clicked', async () => {
      const onDisconnect = vi.fn();
      
      render(
        <IntegrationCard
          integration={mockIntegrationConfig}
          connection={mockIntegrationConnection}
          onDisconnect={onDisconnect}
        />
      );

      fireEvent.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalledWith(mockIntegrationConnection.id);
      });
    });

    test('should display integration capabilities', () => {
      render(
        <IntegrationCard
          integration={mockIntegrationConfig}
          onConnect={vi.fn()}
        />
      );

      expect(screen.getByText('OAuth Authentication')).toBeInTheDocument();
      expect(screen.getByText('Webhook Support')).toBeInTheDocument();
      expect(screen.getByText('Data Sync')).toBeInTheDocument();
    });
  });

  describe('IntegrationManager Component', () => {
    test('should render integration manager with tabs', () => {
      render(<IntegrationManager />);

      expect(screen.getByText('Available Integrations')).toBeInTheDocument();
      expect(screen.getByText('My Connections')).toBeInTheDocument();
    });

    test('should show loading state initially', () => {
      render(<IntegrationManager />);

      expect(screen.getByText('Loading integrations...')).toBeInTheDocument();
    });

    test('should display integration statistics', async () => {
      render(<IntegrationManager />);

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('Errors')).toBeInTheDocument();
      });
    });

    test('should handle refresh action', async () => {
      render(<IntegrationManager />);

      const refreshButton = screen.getByLabelText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      });
    });
  });

  describe('OAuthCallback Component', () => {
    test('should show loading state initially', () => {
      render(<OAuthCallback />);

      expect(screen.getByText('Processing Integration')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we complete your integration setup...')).toBeInTheDocument();
    });

    test('should handle successful OAuth callback', async () => {
      // Mock successful callback
      const mockSearchParams = new URLSearchParams({
        code: 'test-code',
        state: 'test-state',
        integration_id: 'zoom'
      });

      vi.mocked(mockSearchParams.get).mockImplementation((key) => {
        switch (key) {
          case 'code': return 'test-code';
          case 'state': return 'test-state';
          case 'integration_id': return 'zoom';
          default: return null;
        }
      });

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByText('Integration Connected!')).toBeInTheDocument();
      });
    });

    test('should handle OAuth error', async () => {
      // Mock error callback
      const mockSearchParams = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User denied access'
      });

      vi.mocked(mockSearchParams.get).mockImplementation((key) => {
        switch (key) {
          case 'error': return 'access_denied';
          case 'error_description': return 'User denied access';
          default: return null;
        }
      });

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByText('Integration Failed')).toBeInTheDocument();
        expect(screen.getByText(/access_denied/)).toBeInTheDocument();
      });
    });
  });

  describe('IntegrationMonitor Component', () => {
    const mockConnection = {
      ...mockIntegrationConnection,
      last_sync_at: new Date().toISOString()
    };

    const mockMetrics = {
      total_operations: 100,
      successful_operations: 95,
      failed_operations: 5,
      average_processing_time: 2.5,
      uptime_percentage: 99.5
    };

    const mockSyncOperations = [
      {
        id: 'sync-1',
        operation_type: 'full_sync',
        operation_status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        records_processed: 50
      }
    ];

    const mockWebhookLogs = [
      {
        id: 'webhook-1',
        webhook_event: 'user.created',
        processing_status: 'success',
        created_at: new Date().toISOString(),
        retry_count: 0
      }
    ];

    test('should render connection overview', () => {
      render(
        <IntegrationMonitor
          connection={mockConnection}
          metrics={mockMetrics}
          syncOperations={mockSyncOperations}
          webhookLogs={mockWebhookLogs}
        />
      );

      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Total Operations')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('should display sync operations tab', () => {
      render(
        <IntegrationMonitor
          connection={mockConnection}
          metrics={mockMetrics}
          syncOperations={mockSyncOperations}
          webhookLogs={mockWebhookLogs}
        />
      );

      expect(screen.getByText('Sync Operations')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Sync Operations'));
      
      expect(screen.getByText('full_sync')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    test('should display webhook logs tab', () => {
      render(
        <IntegrationMonitor
          connection={mockConnection}
          metrics={mockMetrics}
          syncOperations={mockSyncOperations}
          webhookLogs={mockWebhookLogs}
        />
      );

      expect(screen.getByText('Webhook Logs')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Webhook Logs'));
      
      expect(screen.getByText('user.created')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
    });

    test('should show empty state for no operations', () => {
      render(
        <IntegrationMonitor
          connection={mockConnection}
          metrics={mockMetrics}
          syncOperations={[]}
          webhookLogs={[]}
        />
      );

      fireEvent.click(screen.getByText('Sync Operations'));
      expect(screen.getByText('No sync operations found')).toBeInTheDocument();
    });
  });
});