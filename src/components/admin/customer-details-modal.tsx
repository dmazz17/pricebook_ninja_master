
'use client';

import { useState, useEffect } from 'react';
import type { StripeCustomer, StripeTransaction } from '@/lib/stripe';
import { getCustomerPurchaseHistory } from '@/app/admin/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Mail, User, CreditCard } from 'lucide-react';

interface CustomerDetailsModalProps {
  customer: StripeCustomer;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusVariant = (status: string): BadgeProps['variant'] => {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'paid':
      return 'success';
    case 'pending':
      return 'info';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function CustomerDetailsModal({ customer, isOpen, onClose }: CustomerDetailsModalProps) {
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer.email) {
      setLoading(true);
      getCustomerPurchaseHistory(customer.email)
        .then(data => setTransactions(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, customer.email]);

  if (!isOpen) return null;

  const formatModalDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatTransactionDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount / 100);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-6 w-6" /> 
            {customer.name || 'Customer Details'}
          </DialogTitle>
          <DialogDescription>
            Details and purchase history for {customer.email || 'this customer'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{customer.email || 'No email provided'}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>Joined: {formatModalDate(customer.created)}</span>
                </div>
                {customer.isGuest && (
                    <div className="col-span-full">
                        <Badge variant="outline">This is a guest customer.</Badge>
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Recent Activity
                </h3>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : transactions.length > 0 ? (
                                transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell>{formatTransactionDate(txn.created)}</TableCell>
                                        <TableCell className="text-muted-foreground">{txn.description || 'N/A'}</TableCell>
                                        <TableCell className="font-medium">{formatCurrency(txn.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(txn.status)}>{txn.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No purchase history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
