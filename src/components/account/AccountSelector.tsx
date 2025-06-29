
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Plus, Search } from 'lucide-react'

interface Account {
  id: string
  name: string
  dealStage: string
  lastActivity?: Date
}

// Mock data - will be replaced with real data from Supabase
const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    dealStage: 'Discovery',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'TechStart Inc',
    dealStage: 'Proposal',
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'GlobalTech Solutions',
    dealStage: 'Negotiation',
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
]

export function AccountSelector() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountStage, setNewAccountStage] = useState('')

  const filteredAccounts = mockAccounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateAccount = () => {
    if (newAccountName.trim()) {
      // TODO: Implement account creation
      console.log('Creating account:', { name: newAccountName, stage: newAccountStage })
      setIsCreateDialogOpen(false)
      setNewAccountName('')
      setNewAccountStage('')
    }
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <span>Manage Accounts</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Organize your sales prospects and track deal progression
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Create */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Enter account name"
                  />
                </div>
                <div>
                  <Label htmlFor="deal-stage">Deal Stage</Label>
                  <Select value={newAccountStage} onValueChange={setNewAccountStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discovery">Discovery</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed-won">Closed Won</SelectItem>
                      <SelectItem value="closed-lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAccount}>
                    Create Account
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Accounts List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No accounts found</p>
              {searchTerm && (
                <p className="text-gray-400 text-sm">Try adjusting your search</p>
              )}
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{account.name}</p>
                  <p className="text-sm text-slate-500">Stage: {account.dealStage}</p>
                </div>
                <Button variant="ghost" size="sm">
                  Select
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
