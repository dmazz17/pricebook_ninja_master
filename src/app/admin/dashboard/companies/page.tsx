
'use client';

import { useState } from 'react';
import { getCompanies } from '@/lib/data';
import type { CompanyWithContacts } from '@/lib/data';
import { MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { CompanyDetailsModal } from '@/components/admin/company-details-modal';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithContacts[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithContacts | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    async function loadData() {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
      setLoading(false);
    }
    loadData();
  });

  const handleViewDetails = (company: CompanyWithContacts) => {
    setSelectedCompany(company);
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Companies
          </h1>
          <p className="text-muted-foreground">
            Manage your client companies and their contacts.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>A list of all companies in the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry || 'N/A'}</TableCell>
                    <TableCell>
                      {company.website ? (
                        <Link
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {company.website}
                        </Link>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{company.contacts.length}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleViewDetails(company)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedCompany && (
        <CompanyDetailsModal 
          company={selectedCompany} 
          isOpen={!!selectedCompany}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
