
'use client';

import { useState, useEffect } from 'react';
import { getStripeProducts, type StripeProduct } from '@/lib/stripe';
import { uploadPricebook, getPricebookAssignments, type PricebookAssignment } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, UploadCloud, FileText, Image as ImageIcon, CheckCircle, Loader2, Replace } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

function getFileNameFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        return decodeURIComponent(pathSegments[pathSegments.length - 1]);
    } catch (e) {
        return null;
    }
}

function FileUploadCell({ 
    productId, 
    assignedUrl,
    onUploadSuccess 
}: { 
    productId: string,
    assignedUrl: string | null,
    onUploadSuccess: () => void,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileName = getFileNameFromUrl(assignedUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      await uploadPricebook(productId, file);
      toast({
        title: "Upload Successful",
        description: `${file.name} has been assigned to the product.`,
        variant: 'default'
      });
      onUploadSuccess(); // Trigger data refresh
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {fileName ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md border bg-secondary">
             <FileText className="h-4 w-4" />
             <span className="font-medium truncate max-w-xs">{fileName}</span>
          </div>
          <Button asChild variant="outline" size="sm" disabled={isUploading}>
            <label htmlFor={`file-upload-${productId}`} className="cursor-pointer">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Replace'}
            </label>
          </Button>
        </div>
      ) : (
        <Button asChild variant="outline" size="sm" disabled={isUploading}>
            <label htmlFor={`file-upload-${productId}`} className="cursor-pointer">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
            </label>
        </Button>
      )}
      <Input
        id={`file-upload-${productId}`}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, assignmentsData] = await Promise.all([
        getStripeProducts(),
        getPricebookAssignments(),
      ]);
      setProducts(productsData);
      setAssignments(new Map(assignmentsData.map(a => [a.product_id, a.pricebook_url])));
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage product and pricebook assignments.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product &amp; Pricebook Management</CardTitle>
          <CardDescription>
            Associate your Stripe products with their corresponding pricebook files. When a customer purchases a product, the assigned pricebook will be made available to them in their portal.
          </CardDescription>
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Assigned Pricebook</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    </TableRow>
                ))
              ) : products.length > 0 ? (
                 products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-md text-muted-foreground">
                            <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </TableCell>
                    <TableCell>
                       {product.price ? (
                            <Badge variant="secondary">{product.price}</Badge>
                        ) : (
                            <span className="text-muted-foreground text-xs">Not set</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <FileUploadCell
                            productId={product.id}
                            assignedUrl={assignments.get(product.id) || null}
                            onUploadSuccess={loadData}
                        />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                        No active products found in your Stripe account.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

