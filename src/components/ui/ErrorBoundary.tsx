import React, { Component, ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an error while loading this section. Please try again or return to the dashboard.
          </p>
          
          {isDev && error && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between"
              >
                <span className="text-xs font-mono">Show error details</span>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showDetails && (
                <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-48">
                  <div className="text-destructive mb-2">{error.message}</div>
                  {error.stack && (
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {error.stack.split('\n').slice(0, 5).join('\n')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={onRetry} variant="outline" className="flex-1">
              Retry
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="flex-1">
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorBoundary({ children }: Props) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}
