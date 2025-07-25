
'use server';

import { z } from 'zod';
import { getStripeTransactionsForCustomer } from '@/lib/stripe';
import { syncUserPricebooksFromStripe, getPricebookAssignments } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';


export async function getCustomerPurchaseHistory(customerEmail: string) {
    if (!customerEmail) {
        return [];
    }
    try {
        const transactions = await getStripeTransactionsForCustomer(customerEmail);
        return transactions;
    } catch (error) {
        console.error('Failed to get purchase history:', error);
        // In a real app, you might want to return an error state
        return [];
    }
}

export async function triggerPricebookSync() {
    console.log("Action: Triggering pricebook sync...");
    const result = await syncUserPricebooksFromStripe();
    console.log("Action: Sync result:", result);
    return result;
}

const ManualAssignSchema = z.object({
    userEmail: z.string().email(),
    productId: z.string(),
    productName: z.string(),
    transactionId: z.string(),
    purchaseDate: z.string(),
});

export async function manuallyAssignPricebook(formData: FormData) {
    const validatedFields = ManualAssignSchema.safeParse({
        userEmail: formData.get('userEmail'),
        productId: formData.get('productId'),
        productName: formData.get('productName'),
        transactionId: formData.get('transactionId'),
        purchaseDate: formData.get('purchaseDate'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid data provided.' };
    }

    const { userEmail, productId, productName, transactionId, purchaseDate } = validatedFields.data;

    try {
        const assignments = await getPricebookAssignments();
        const pricebookMap = new Map(assignments.map(a => [a.product_id, a.pricebook_url]));

        if (!pricebookMap.has(productId)) {
            return { success: false, message: 'No pricebook is assigned to this product in settings.' };
        }

        const pricebookUrl = pricebookMap.get(productId)!;

        const { error } = await supabase
            .from('user_assigned_pricebooks')
            .upsert({
                user_email: userEmail,
                stripe_transaction_id: transactionId,
                product_name: productName,
                pricebook_url: pricebookUrl,
                purchase_date: new Date(parseInt(purchaseDate) * 1000).toISOString(),
            }, { onConflict: 'stripe_transaction_id' });

        if (error) {
            console.error('Error during manual assignment:', error);
            return { success: false, message: `Database error: ${error.message}` };
        }

        revalidatePath('/admin/dashboard/payments');
        return { success: true, message: `Assigned '${productName}' to ${userEmail}.` };

    } catch (error: any) {
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
}
