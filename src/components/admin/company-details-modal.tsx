
'use client';

import type { CompanyWithContacts } from '@/lib/data';
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
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-react';

interface CompanyDetailsModalProps {
  company: CompanyWithContacts;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyDetailsModal({ company, isOpen, onClose }: CompanyDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" /> 
            {company.name}
          </DialogTitle>
          <DialogDescription>{company.industry || 'No industry specified'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                    <span>{company.address || 'No address provided'}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>{company.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-3 col-span-2">
                    <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {company.website ? (
                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {company.website}
                        </a>
                    ) : (
                        <span>No website provided</span>
                    )}
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-2">Contacts</h3>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {company.contacts.length > 0 ? (
                            company.contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">{contact.name}</TableCell>
                                    <TableCell>
                                        {contact.job_title ? (
                                            <Badge variant="secondary">{contact.job_title}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            {contact.email || <span className="text-muted-foreground">N/A</span>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    No contacts found for this company.
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
