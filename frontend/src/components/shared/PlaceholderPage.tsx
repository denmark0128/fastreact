import PageHeader from './PageHeader'
import { Card, CardContent } from '../ui/card'

interface PlaceholderPageProps {
  title: string
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">
          This module is scaffolded and will be implemented in the next phase.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

export default PlaceholderPage
