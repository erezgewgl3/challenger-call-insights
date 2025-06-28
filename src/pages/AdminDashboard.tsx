
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MessageSquare, Settings, Activity } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 to-violet-300">
      {/* Header */}
      <DashboardHeader
        title="Sales Whisperer Admin"
        subtitle="System Administration"
        iconColor="bg-indigo-600"
        showAdminBadge={true}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
          <p className="text-lg text-slate-600">
            Manage users, prompts, and system configuration
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Default prompts active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analyses Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <span>AI Prompt Management</span>
              </CardTitle>
              <CardDescription>
                Manage and version control AI coaching prompts for different analysis types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Create, edit, and version AI prompts with full audit trails.</p>
              <div className="text-sm text-slate-500 mb-4">
                <p>• Create custom prompts for different sales scenarios</p>
                <p>• Version control and rollback capabilities</p>
                <p>• Variable insertion for dynamic content</p>
              </div>
              <Link to="/admin/prompts">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Manage Prompts
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and invitation system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Coming in next implementation phase...</p>
              <div className="text-sm text-slate-500">
                <p>• Send and manage user invitations</p>
                <p>• Assign roles and permissions</p>
                <p>• Monitor user activity and usage</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system information and health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <p className="text-sm font-medium text-green-800">Database</p>
                <p className="text-xs text-green-600">Connected</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <p className="text-sm font-medium text-green-800">Authentication</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <p className="text-sm font-medium text-green-800">Prompt System</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">i</div>
                <p className="text-sm font-medium text-indigo-800">AI Services</p>
                <p className="text-xs text-indigo-600">Ready for setup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
