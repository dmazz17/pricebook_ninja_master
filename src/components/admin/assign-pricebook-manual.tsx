
'use client';

import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { StripeTransaction } from '@/lib/stripe';
import type { ProductWithPricebook } from '@/lib/data';
import { manuallyAssignPricebook } from '@/app/admin/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AssignPricebookManualProps {
  transaction: StripeTransaction;
  products: ProductWithPricebook[];
}

export function AssignPricebookManual({ transaction, products }: AssignPricebookManualProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAssign = (productId: string) => {
    if (!transaction.customerEmail) {
      toast({
        title: 'Assignment Failed',
        description: 'No customer email found for this transaction.',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast({
        title: 'Assignment Failed',
        description: 'Selected product not found.',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('userEmail', transaction.customerEmail);
    formData.append('productId', product.id);
    formData.append('productName', product.name);
    formData.append('transactionId', transaction.id);
    formData.append('purchaseDate', transaction.created.toString());

    startTransition(async () => {
      const result = await manuallyAssignPricebook(formData);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
        <Select
            onValueChange={handleAssign}
            disabled={isPending || !transaction.customerEmail}
            >
            <SelectTrigger className="w-40">
                <SelectValue placeholder="Select a product..." />
            </SelectTrigger>
            <SelectContent>
                {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                    {product.name}
                </SelectItem>
                ))}
            </SelectContent>
        </Select>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}
