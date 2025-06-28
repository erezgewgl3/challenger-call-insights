
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MessageSquare, Settings, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
          <p className="text-lg text-slate-600">
            Manage users, prompts, and system configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">--</div>
              <p className="text-xs text-slate-500 mt-1">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Active Prompts</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">2</div>
              <p className="text-xs text-slate-500 mt-1">Default prompts active</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Analyses Today</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">--</div>
              <p className="text-xs text-slate-500 mt-1">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">System Health</CardTitle>
              <Settings className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-xs text-slate-500 mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <span>AI Prompt Management</span>
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Manage and version control AI coaching prompts for different analysis types
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 mb-6 leading-relaxed">Create, edit, and version AI prompts with full audit trails.</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span>Create custom prompts for different sales scenarios</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span>Version control and rollback capabilities</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span>Variable insertion for dynamic content</span>
                </div>
              </div>
              <Link to="/admin/prompts">
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg">
                  Manage Prompts
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <span>User Management</span>
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Manage user accounts, roles, and invitation system
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 mb-6 leading-relaxed">Coming in next implementation phase...</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-500">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                  <span>Send and manage user invitations</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                  <span>Assign roles and permissions</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                  <span>Monitor user activity and usage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">System Status</CardTitle>
            <CardDescription className="text-slate-600">
              Current system information and health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                <p className="text-sm font-semibold text-green-800 mb-1">Database</p>
                <p className="text-xs text-green-600">Connected</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                <p className="text-sm font-semibold text-green-800 mb-1">Authentication</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                <p className="text-sm font-semibold text-green-800 mb-1">Prompt System</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                <div className="text-3xl font-bold text-indigo-600 mb-2">i</div>
                <p className="text-sm font-semibold text-indigo-800 mb-1">AI Services</p>
                <p className="text-xs text-indigo-600">Ready for setup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
