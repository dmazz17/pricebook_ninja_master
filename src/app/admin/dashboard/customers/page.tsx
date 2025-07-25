
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Users, AlertTriangle, Mail, Calendar, Search, RefreshCw, Loader2, Link as LinkIcon } from 'lucide-react';
import { getStripeCustomers, type StripeCustomer } from '@/lib/stripe';
import { CustomerDetailsModal } from '@/components/admin/customer-details-modal';
import { triggerPricebookSync } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<StripeCustomer | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const fetchCustomers = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      setError(null);
      const data = await getStripeCustomers();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  const handleSync = () => {
    startSyncTransition(async () => {
      const result = await triggerPricebookSync();
      if (result.success) {
        toast({
            title: "Sync Successful",
            description: result.message,
        });
      } else {
         toast({
            title: "Sync Failed",
            description: result.message,
            variant: 'destructive'
        });
      }
    });
  };

  useEffect(() => {
    fetchCustomers(true);
    // Initial sync on load
    handleSync();
  }, [fetchCustomers]);
  
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    return (
      (customer.name || 'unknown').toLowerCase().includes(term) ||
      (customer.email || '').toLowerCase().includes(term)
    );
  });

  const handleCloseModal = () => {
    setSelectedCustomer(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            View and manage your Stripe customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchCustomers(false)} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh List
            </Button>
            <Button variant="default" size="sm" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Sync Purchases
            </Button>
         </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>A list of all customers, including guests, in your Stripe account.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..."
                className="pl-10 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
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
                <TableHead>Email</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && customers.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {customer.name || <span className="text-muted-foreground">Unknown</span>}
                        {customer.isGuest && <Badge variant="secondary">Guest</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {customer.email || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(customer.created)}
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>View Details</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
           { !loading && filteredCustomers.length === 0 && !error && (
            <div className="text-center text-muted-foreground py-12">
              <p>{searchTerm ? 'No customers match your search.' : 'No customers found.'}</p>
            </div>
           )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
