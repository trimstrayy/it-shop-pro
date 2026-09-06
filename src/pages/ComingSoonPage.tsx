import { Clock3 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

const ComingSoonPage = ({ title, description }: ComingSoonPageProps) => (
  <AppLayout>
    <PageHeader title={title} description={description} />
    <Card className="max-w-2xl">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 p-4"><Clock3 className="h-10 w-10 text-primary" /></div>
        <h2 className="text-2xl font-semibold">Coming Soon</h2>
        <p className="max-w-md text-muted-foreground">This feature is being prepared and will be available in a future update.</p>
      </CardContent>
    </Card>
  </AppLayout>
);

export default ComingSoonPage;
