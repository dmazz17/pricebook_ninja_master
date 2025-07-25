
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Download, RefreshCw } from 'lucide-react';
import { getUserPurchases, type AssignedPricebook } from '@/lib/data';

function PurchasesContent() {
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const [purchases, setPurchases] = useState<AssignedPricebook[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPurchases = useCallback(async () => {
        if (!email) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await getUserPurchases(email);
            setPurchases(data);
        } catch (error) {
            console.error("Failed to load purchases", error);
        } finally {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        loadPurchases();
    }, [loadPurchases]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Your Purchases</h1>
                <p className="text-muted-foreground">Access your purchased pricebooks and materials.</p>
                </div>
                 <Button variant="outline" size="sm" onClick={loadPurchases} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="h-6 w-6" />
                        <CardTitle>My Pricebooks</CardTitle>
                    </div>
                    <CardDescription>
                        This section contains the pricebooks that have been assigned to you after your purchase.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : purchases.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead className="text-right">Download</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.map((purchase, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{purchase.productName}</TableCell>
                                        <TableCell>{purchase.purchaseDate}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild size="sm">
                                                <a href={purchase.pricebookUrl} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12 h-64">
                            <p>No pricebooks have been assigned to you yet.</p>
                            <p className="text-sm mt-2">Once assigned, they will appear here for you to download.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function PurchasesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <PurchasesContent />
      </Suspense>
    </div>
  );
}
