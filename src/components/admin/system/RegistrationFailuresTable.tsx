import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, Mail, Eye, UserPlus } from 'lucide-react';
import { useRegistrationFailures, useMarkFailureResolved } from '@/hooks/useRegistrationFailures';
import { RegistrationFailureModal } from './RegistrationFailureModal';
import { toast } from '@/hooks/use-toast';

export function RegistrationFailuresTable() {
  const { data: failures, isLoading } = useRegistrationFailures();
  const markResolved = useMarkFailureResolved();
  const [selectedFailure, setSelectedFailure] = useState<string | null>(null);

  const handleMarkResolved = async (id: string, method: string) => {
    try {
      await markResolved.mutateAsync({ id, method });
      toast({
        title: "Success",
        description: "Failure marked as resolved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as resolved",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration Failures</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unresolved = failures?.filter(f => !f.resolved) || [];
  const resolved = failures?.filter(f => f.resolved) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Registration Failures</span>
            {unresolved.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unresolved.length} unresolved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Monitor and resolve user registration issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failures?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Registration Failures</h3>
              <p className="text-slate-600">All user registrations are working properly.</p>
            </div>
          ) : (
            <>
              {/* Unresolved Failures */}
              {unresolved.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-red-600 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Unresolved Issues ({unresolved.length})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Email</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Attempted</TableHead>
                        <TableHead>Alert Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unresolved.map((failure) => (
                        <TableRow key={failure.id} className="bg-red-50">
                          <TableCell className="font-medium">{failure.user_email}</TableCell>
                          <TableCell className="max-w-xs truncate">{failure.error_message}</TableCell>
                          <TableCell>{new Date(failure.attempted_at).toLocaleString()}</TableCell>
                          <TableCell>
                            {failure.alert_sent ? (
                              <Badge variant="secondary" className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>Sent</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedFailure(failure.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleMarkResolved(failure.id, 'Manual')}
                                disabled={markResolved.isPending}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Resolved Failures */}
              {resolved.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-green-600 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolved Issues ({resolved.length})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Email</TableHead>
                        <TableHead>Resolution Method</TableHead>
                        <TableHead>Resolved At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolved.slice(0, 10).map((failure) => (
                        <TableRow key={failure.id} className="bg-green-50">
                          <TableCell className="font-medium">{failure.user_email}</TableCell>
                          <TableCell>{failure.resolution_method || 'Unknown'}</TableCell>
                          <TableCell>
                            {failure.resolved_at ? new Date(failure.resolved_at).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedFailure(failure.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {resolved.length > 10 && (
                    <p className="text-sm text-slate-600 mt-2">
                      Showing 10 of {resolved.length} resolved failures
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <RegistrationFailureModal
        failureId={selectedFailure}
        isOpen={!!selectedFailure}
        onClose={() => setSelectedFailure(null)}
      />
    </>
  );
}