import type { Company } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Phone, Globe, MapPin, Briefcase } from 'lucide-react';

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Company Details</CardTitle>
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="font-bold text-2xl text-foreground font-headline">{company.name}</div>
        <div className="text-sm text-muted-foreground space-y-3">
          {company.industry && company.industry !== 'N/A' && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-3 flex-shrink-0" />
              <span>{company.industry}</span>
            </div>
          )}
          {company.address && company.address !== 'N/A' && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-3 flex-shrink-0" />
              <span>{company.address}</span>
            </div>
          )}
          {company.phone && company.phone !== 'N/A' && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-3 flex-shrink-0" />
              <span>{company.phone}</span>
            </div>
          )}
          {company.website && company.website !== 'N/A' && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-3 flex-shrink-0" />
              <a 
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                {company.website}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
