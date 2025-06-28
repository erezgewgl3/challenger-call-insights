
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, User, Building } from 'lucide-react'

interface VariableInserterProps {
  onInsert: (variable: string) => void
}

export function VariableInserter({ onInsert }: VariableInserterProps) {
  const variables = [
    {
      name: '{{conversation}}',
      icon: MessageSquare,
      description: 'The sales conversation transcript'
    },
    {
      name: '{{account_context}}',
      icon: Building,
      description: 'Previous conversations and account history'
    },
    {
      name: '{{user_context}}',
      icon: User,
      description: 'User preferences and selling style'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Insert Variables</CardTitle>
        <CardDescription className="text-xs">
          Click to insert dynamic variables into your prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {variables.map((variable) => (
          <Button
            key={variable.name}
            variant="outline"
            size="sm"
            className="w-full justify-start text-left h-auto p-3"
            onClick={() => onInsert(variable.name)}
          >
            <variable.icon className="h-3 w-3 mr-2 flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span className="font-mono text-xs">{variable.name}</span>
              <span className="text-xs text-muted-foreground">{variable.description}</span>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
