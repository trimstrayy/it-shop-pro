import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface TemporaryPasswordProps {
  password: string;
}

export const TemporaryPassword = ({ password }: TemporaryPasswordProps) => {
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      toast({ title: 'Password copied', description: 'The temporary password is ready to paste.' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Select the password field and copy it manually.', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm">Temporary password</p>
      <div className="flex gap-2">
        <Input value={password} readOnly aria-label="Temporary password" className="font-mono" onFocus={(event) => event.currentTarget.select()} />
        <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label="Copy temporary password" title="Copy temporary password">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
