
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowUpDown, CreditCard, DollarSign, ExternalLink, AlertTriangle, Mail, RefreshCw, Loader2, Link as LinkIcon } from 'lucide-react';
import type { BadgeProps } from '@/components/ui/badge';
import { getStripeTransactions, type StripeTransaction } from '@/lib/stripe';
import { triggerPricebookSync } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { getProductsWithAssignedPricebooks, type ProductWithPricebook } from '@/lib/data';
import { AssignPricebookManual } from '@/components/admin/assign-pricebook-manual';


const getStatusVariant = (status: string): BadgeProps['variant'] => {
  switch (status.toLowerCase()) {
    case 'succeeded':
      return 'success';
    case 'paid':
       return 'success';
    case 'pending':
      return 'info';
    case 'upcoming':
       return 'info';
    case 'refunded':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [assignableProducts, setAssignableProducts] = useState<ProductWithPricebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const fetchInitialData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      setError(null);
      const [transactionsData, productsData] = await Promise.all([
        getStripeTransactions(),
        getProductsWithAssignedPricebooks(),
      ]);
      setTransactions(transactionsData);
      setAssignableProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  const handleSync = useCallback((showToast = false) => {
    startSyncTransition(async () => {
      const result = await triggerPricebookSync();
      if (showToast) {
        if (result.success) {
          toast({
              title: "Sync Successful",
              description: result.message,
          });
          // Refresh data after sync
          fetchInitialData(false);
        } else {
           toast({
              title: "Sync Failed",
              description: result.message,
              variant: 'destructive'
          });
        }
      }
    });
  }, [fetchInitialData, toast]);

  useEffect(() => {
    fetchInitialData(true);
    handleSync(true); // Initial sync on load with toast
  }, [fetchInitialData, handleSync]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Stripe amounts are in cents
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View and manage all transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchInitialData(false)} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh List
            </Button>
            <Button variant="default" size="sm" onClick={() => handleSync(true)} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Sync Purchases
            </Button>
        </div>
      </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">$5,000.00</div>
                <p className="text-xs text-muted-foreground">Next payment in 10 days</p>
            </CardContent>
            </Card>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A list of all payments processed through Stripe. Use the dropdown to manually assign a pricebook if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Fetching Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                    <Button variant="ghost" className="p-0 hover:bg-transparent">
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" className="p-0 hover:bg-transparent">
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Assign Pricebook</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && transactions.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    </TableRow>
                ))
              ) : (
                transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">
                        <div>{txn.customerName || 'Unknown'}</div>
                        {txn.customerEmail && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3 w-3"/>
                                {txn.customerEmail}
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{txn.description || 'N/A'}</TableCell>
                    <TableCell>{formatDate(txn.created)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(txn.status)}>{txn.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button asChild variant="ghost" size="icon" disabled={!txn.receiptUrl}>
                        <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <AssignPricebookManual transaction={txn} products={assignableProducts} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
           { !loading && transactions.length === 0 && !error && (
            <div className="text-center text-muted-foreground py-12">
              <p>No transactions found.</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
