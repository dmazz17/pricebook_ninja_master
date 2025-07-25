
'use server';

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from .env.local');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export interface StripeTransaction {
  id: string;
  amount: number;
  created: number;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  description: string | null;
  receiptUrl: string | null;
  productId?: string;
}

export interface StripeCustomer {
  id: string;
  name: string | null;
  email: string | null;
  created: number | null;
  isGuest: boolean;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
}


async function getProductIdFromCharge(chargeId: string): Promise<string | undefined> {
  try {
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ['invoice'],
    });

    // 1. Best case: Charge is linked to an invoice with line items
    if (charge.invoice && typeof charge.invoice === 'object') {
        const invoice = await stripe.invoices.retrieve(charge.invoice.id, { expand: ['lines.data.price.product']});
        const product = invoice.lines.data[0]?.price?.product;
        if (product && typeof product === 'object' && 'id' in product) {
            return product.id;
        }
    }
    
    // 2. Fallback: Check the balance transaction for price, which has product
    const balanceTxn = await stripe.balanceTransactions.retrieve(charge.balance_transaction as string, {
        expand: ['source']
    });

    const chargeSource = balanceTxn.source;

    if (chargeSource && typeof chargeSource === 'object' && 'price' in chargeSource && chargeSource.price) {
        const price = chargeSource.price as Stripe.Price | null;
        if (price && typeof price.product === 'string') {
            return price.product;
        }
        if (price && typeof price.product === 'object' && 'id' in price.product) {
            return price.product.id;
        }
    }

  } catch (e: any) {
    // This can happen for various reasons, e.g. manual charges without products.
    // console.warn(`Could not determine product for charge ${chargeId}:`, e.message);
  }
  return undefined;
}


export async function getStripeTransactions(): Promise<StripeTransaction[]> {
  try {
    const [paymentIntents, products] = await Promise.all([
      stripe.paymentIntents.list({
        limit: 100, // Fetch the last 100 payment intents
        expand: ['data.customer', 'data.latest_charge'],
      }),
      stripe.products.list({ limit: 100, active: true })
    ]);

    const productMap = new Map(products.data.map(p => [p.id, p.name]));

    const transactions = await Promise.all(
        paymentIntents.data.map(async (pi) => {
            let customerName: string | null = null;
            let customerEmail: string | null = pi.receipt_email;
            let productId: string | undefined = undefined;
            let description: string | null = pi.description;

            if (pi.customer && typeof pi.customer === 'object') {
                customerName = pi.customer.name;
                if (pi.customer.email) customerEmail = pi.customer.email;
            }

            const charge = pi.latest_charge;
            if (charge && typeof charge === 'object') {
                if (!customerName) customerName = charge.billing_details.name;
                if (!customerEmail) customerEmail = charge.billing_details.email;
                
                productId = await getProductIdFromCharge(charge.id);
                
                if (productId && productMap.has(productId)) {
                    description = productMap.get(productId)!;
                } else {
                    description = pi.description || charge.description;
                }
            }

            return {
                id: pi.id,
                amount: pi.amount,
                created: pi.created,
                status: pi.status,
                customerName,
                customerEmail,
                description,
                receiptUrl: charge && typeof charge === 'object' ? charge.receipt_url : null,
                productId,
            };
        })
    );
    
    return transactions;

  } catch (error: any) {
    console.error("Stripe API Error:", error.message);
    throw new Error(`Failed to fetch transactions from Stripe. ${error.message}`);
  }
}

export async function getStripeCustomers(): Promise<StripeCustomer[]> {
  try {
    const [customersResponse, transactionsResponse] = await Promise.all([
      stripe.customers.list({ limit: 100, expand: ['data'] }),
      stripe.paymentIntents.list({ limit: 100, expand: ['data.customer', 'data.latest_charge'] })
    ]);

    const customerMap = new Map<string, StripeCustomer>();

    // Add all saved customers first
    customersResponse.data.forEach((c) => {
      if (c.email) {
        customerMap.set(c.email, {
          id: c.id,
          name: c.name,
          email: c.email,
          created: c.created,
          isGuest: false,
        });
      }
    });

    // Add or update with guest customers from transactions if they don't already exist
    transactionsResponse.data.forEach((pi) => {
      const email = pi.receipt_email;
      const customer = pi.customer;

      // Only add guests if their email is not already in the map of registered customers
      if (email && !customerMap.has(email)) {
         let name: string | null = null;

         if (customer && typeof customer === 'object' && 'name' in customer && customer.name) {
             name = customer.name;
         } else {
             const charge = pi.latest_charge
             if (charge && typeof charge === 'object' && charge.billing_details && charge.billing_details.name) {
                 name = charge.billing_details.name;
             }
         }

         customerMap.set(email, {
           id: `guest-${pi.id}`, // Create a unique ID for guest
           name: name,
           email: email,
           created: pi.created, // Use transaction creation time as join date
           isGuest: true,
         });
      }
    });
    
    const allCustomers = Array.from(customerMap.values());
    
    // Sort by creation date, with guests potentially mixed in
    allCustomers.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

    return allCustomers;

  } catch (error: any) {
    console.error("Stripe API Error:", error.message);
    throw new Error(`Failed to fetch customers from Stripe. ${error.message}`);
  }
}

export async function getStripeCustomerByEmail(email: string): Promise<StripeCustomer | null> {
    try {
        const customers = await getStripeCustomers();
        return customers.find(c => c.email === email) || null;
    } catch (error: any) {
        console.error(`Stripe API Error fetching customer by email ${email}:`, error.message);
        throw new Error(`Failed to fetch customer by email. ${error.message}`);
    }
}

export async function getStripeTransactionsForCustomer(customerEmail: string): Promise<StripeTransaction[]> {
    try {
        const allTransactions = await getStripeTransactions();
        return allTransactions.filter(txn => txn.customerEmail === customerEmail);
    } catch (error: any) {
        console.error(`Stripe API Error fetching transactions for ${customerEmail}:`, error.message);
        throw new Error(`Failed to fetch transactions for customer. ${error.message}`);
    }
}

export async function getStripeProducts(): Promise<StripeProduct[]> {
  try {
    const products = await stripe.products.list({
      limit: 100,
      active: true,
      expand: ['data.default_price'],
    });
    
    return products.data.map((product) => {
      const price = product.default_price as Stripe.Price | null;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.images?.[0] || null,
        price: price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency }).format((price.unit_amount || 0) / 100) : null,
      }
    });

  } catch (error: any) {
    console.error("Stripe API Error:", error.message);
    throw new Error(`Failed to fetch products from Stripe. ${error.message}`);
  }
}
