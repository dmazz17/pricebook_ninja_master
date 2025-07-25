'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';

type LaborRate = {
  id: number;
  name: string;
  rate: string; // Using string for input field compatibility
};

export default function PricebookSpecsPage() {
  const [laborRates, setLaborRates] = useState<LaborRate[]>([
    { id: 1, name: 'Standard Rate', rate: '100' },
    { id: 2, name: 'Overtime Rate', rate: '150' },
    { id: 3, name: 'Emergency Rate', rate: '200' },
  ]);

  const handleRateChange = (id: number, field: 'name' | 'rate', value: string) => {
    setLaborRates(prevRates =>
      prevRates.map(rate =>
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    );
  };

  const addCustomRate = () => {
    const newId = laborRates.length > 0 ? Math.max(...laborRates.map(r => r.id)) + 1 : 1;
    setLaborRates(prevRates => [
      ...prevRates,
      { id: newId, name: '', rate: '' },
    ]);
  };

  const removeRate = (id: number) => {
    setLaborRates(prevRates => prevRates.filter(rate => rate.id !== id));
  };


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Pricebook Specs</h1>
          <p className="text-muted-foreground">Manage your company's pricing structure.</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <form>
            <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Labor Rates</CardTitle>
                        <CardDescription>Define the hourly rates for different types of labor.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={addCustomRate}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Rate
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Rate Name</TableHead>
                    <TableHead className="w-[200px]">Rate ($/hr)</TableHead>
                    <TableHead className="w-[50px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {laborRates.map((rate, index) => (
                    <TableRow key={rate.id}>
                        <TableCell>
                        <Input
                            type="text"
                            value={rate.name}
                            onChange={(e) => handleRateChange(rate.id, 'name', e.target.value)}
                            placeholder="e.g., Weekend Rate"
                            disabled={index < 3}
                            className="font-medium"
                        />
                        </TableCell>
                        <TableCell>
                        <Input
                            type="number"
                            value={rate.rate}
                            onChange={(e) => handleRateChange(rate.id, 'rate', e.target.value)}
                            placeholder="e.g., 175"
                            min="0"
                        />
                        </TableCell>
                        <TableCell className="text-right">
                        {index >= 3 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeRate(rate.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Remove Rate</span>
                            </Button>
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit">Save Rates</Button>
            </CardFooter>
            </Card>
        </form>

        <form>
            <Card>
            <CardHeader>
                <CardTitle>Parts & Materials</CardTitle>
                <CardDescription>Set markup and tax rates for parts and materials used in projects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="markup-multiplier">Parts Markup Multiplier</Label>
                    <Input id="markup-multiplier" name="markup_multiplier" type="number" placeholder="e.g., 1.5" step="0.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tax-rate">Parts Tax Rate (%)</Label>
                    <Input id="tax-rate" name="tax_rate" type="number" placeholder="e.g., 8.25" step="0.01" />
                </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit">Save Settings</Button>
            </CardFooter>
            </Card>
        </form>
        
        <form>
            <Card>
            <CardHeader>
                <CardTitle>Request a Service</CardTitle>
                <CardDescription>Request a new service to be added to the pricebook.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="service-name">Service Name</Label>
                <Input id="service-name" name="service_name" placeholder="e.g., HVAC Tune-up" />
                </div>
                <div className="space-y-2">
                <Label htmlFor="parts-included">Parts Included</Label>
                <Textarea id="parts-included" name="parts_included" placeholder="List the parts that are included in this service." />
                </div>
                <div className="space-y-2">
                <Label htmlFor="estimated-labor">Estimated Labor Time</Label>
                <Input id="estimated-labor" name="estimated_labor" placeholder="e.g., 2 hours" />
                </div>
                <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Any additional notes or details about this service." />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit">Submit Request</Button>
            </CardFooter>
            </Card>
        </form>

      </div>
    </div>
  );
}
