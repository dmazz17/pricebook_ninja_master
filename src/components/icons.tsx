import type { SVGProps } from 'react';
import Image from 'next/image';

export const Icons = {
  logo: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
      src="https://i.postimg.cc/B62PJxtg/PN-Logo-2.png" 
      alt="Pricebook Ninjas Logo" 
      {...props}
    />
  ),
};
