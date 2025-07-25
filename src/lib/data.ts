
import { supabase } from './supabase';
import { getStripeTransactions, getStripeCustomerByEmail, getStripeProducts, type StripeProduct } from './stripe';

export interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string | null;
  hoursLogged?: number;
  estimatedHours?: number;
  purchasedHours?: number;
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  industry: string;
}

export interface CompanyWithContacts extends Company {
    contacts: CompanyContact[];
}

export interface ProjectEvent {
  id:string;
  title: string;
  description: string | null;
  eventType: string;
  eventDate: string;
  projectName: string;
}

export interface ClientData {
  company: Company | null;
  projects: Project[];
  user: User;
  events: ProjectEvent[];
}

export interface ProjectComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string;
  };
}

export interface ProjectTimeBlock {
  id: string;
  date: string;
  duration: string;
  description: string | null;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Backlog';

export interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  assignee: {
    id: string;
    name: string;
  } | null;
}

export interface CompanyContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  job_title?: string;
}

export interface FullProject extends Project {
  comments: ProjectComment[];
  timeBlocks: ProjectTimeBlock[];
  tasks: ProjectTask[];
  contacts: CompanyContact[];
}

export interface AssignedPricebook {
    productName: string;
    pricebookUrl: string;
    purchaseDate: string;
}

export interface PricebookAssignment {
    product_id: string;
    pricebook_url: string;
}

export interface ProductWithPricebook extends StripeProduct {
    pricebookUrl: string;
}


export const getClientDataByEmail = async (email: string): Promise<ClientData | null> => {
    // 1. Try to find an existing contact in Supabase
    const { data: contactData, error: contactError } = await supabase
        .from('company_contacts')
        .select('id, first_name, last_name, email, phone, job_title, company_id')
        .eq('email', email)
        .single();
    
    if (contactData && !contactError) {
        // If found, return the full client data as usual
        return getClientDataFromContact(contactData);
    }
    
    if (contactError && contactError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error(`Error fetching contact for email ${email}:`, contactError?.message);
    }

    // 2. If no contact, check Stripe for a customer (guest or registered)
    const stripeCustomer = await getStripeCustomerByEmail(email);
    
    if (stripeCustomer && stripeCustomer.email) {
        // If found in Stripe, create a minimal ClientData object for the guest
        const guestUser: User = {
            id: stripeCustomer.id, // This will be like "guest-pi_..."
            name: stripeCustomer.name || 'Valued Customer',
            email: stripeCustomer.email,
            role: 'Client',
            avatarUrl: 'https://placehold.co/128x128.png',
        };

        return {
            user: guestUser,
            company: null, // No company data for guest users yet
            projects: [],
            events: [],
        };
    }

    // 3. If not found in Supabase or Stripe, create a new temporary guest user object
    const newGuestUser: User = {
        id: `guest-new-${email}`,
        name: 'New User',
        email: email,
        role: 'Client',
        avatarUrl: `https://placehold.co/128x128.png`,
    };

    return {
        user: newGuestUser,
        projects: [],
        events: [],
        company: null,
    };
}


export const getClientDataById = async (id: string): Promise<ClientData | null> => {
    // We prioritize Clerk user ID, but it may not be in company_contacts if they were a guest first.
    // So we fetch by Clerk's user ID OR the user's email.
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
    if(userError) {
        console.error(`Error fetching user from Clerk:`, userError.message);
        return null; // or handle appropriately
    }
    const userEmail = userData.user.email;
    if (!userEmail) {
        console.warn(`User with ID ${id} has no email address.`);
        return null;
    }
    
    return getClientDataByEmail(userEmail);
}

const getClientDataFromContact = async (contactData: any): Promise<ClientData | null> => {
  const user: User = {
    id: contactData.id,
    name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim(),
    email: contactData.email,
    role: contactData.job_title || 'Contact',
    avatarUrl: `https://placehold.co/128x128.png`,
  };
  
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('id, name, industry, website, address')
    .eq('id', contactData.company_id)
    .single();
  
  let company: Company;
  if (companyError || !companyData) {
    console.warn(`No company found for company ID ${contactData.company_id}:`, companyError?.message);
    // Create a default/empty company object if not found
    company = {
      id: contactData.company_id,
      name: 'Company Not Found',
      address: 'N/A',
      phone: contactData.phone || 'N/A',
      website: 'N/A',
      industry: 'N/A',
    };
  } else {
    company = {
        id: companyData.id,
        name: companyData.name || 'N/A',
        address: companyData.address || 'N/A',
        phone: contactData.phone || 'N/A',
        website: companyData.website || 'N/A',
        industry: companyData.industry || 'N/A',
    };
  }
  
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, status, priority, start_date, target_date')
    .eq('company_id', company.id);

  if (projectsError) {
    console.error(`Error fetching projects for company ${company.id}:`, projectsError.message);
  }

  const projectIds = projectsData ? projectsData.map((p: any) => p.id) : [];
  let metadataByProject: Record<string, { estimatedHours: number; purchasedHours: number; hoursLogged: number; tags: string[] }> = {};
  let combinedActivity: ProjectEvent[] = [];

  if (projectIds.length > 0) {
    const [metadataResult, eventsResult, commentsResult] = await Promise.all([
      supabase
        .from('project_metadata')
        .select('project_id, estimated_hours, purchased_hours, hours_used, tags')
        .in('project_id', projectIds),
      supabase
        .from('project_events')
        .select('id, title, description, event_type, event_date, projects(title)')
        .in('project_id', projectIds)
        .order('event_date', { ascending: false })
        .limit(5),
      supabase
        .from('project_comments')
        .select('id, content, created_at, user_id, projects(title)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    
    const { data: metadataData, error: metadataError } = metadataResult;
    if (metadataError) console.error(`Error fetching project metadata:`, metadataError.message);
    else if (metadataData) {
      metadataByProject = metadataData.reduce((acc, meta) => {
        acc[meta.project_id] = {
          estimatedHours: meta.estimated_hours || 0,
          purchasedHours: meta.purchased_hours || 0,
          hoursLogged: meta.hours_used || 0,
          tags: meta.tags || [],
        };
        return acc;
      }, {} as Record<string, any>);
    }

    const { data: eventsData, error: eventsError } = eventsResult;
    if (eventsError) console.error(`Error fetching project events:`, eventsError.message);
    
    const { data: commentsData, error: commentsError } = commentsResult;
    if (commentsError) console.error(`Error fetching project comments:`, commentsError.message);

    const commentAuthorIds = commentsData ? [...new Set(commentsData.map(c => c.user_id).filter(Boolean))] : [];
    let commentAuthorsById: Record<string, string> = {};
    if (commentAuthorIds.length > 0) {
      const { data: authorsData, error: authorsError } = await supabase
        .from('company_contacts')
        .select('id, first_name, last_name')
        .in('id', commentAuthorIds);
      
      if (authorsData && !authorsError) {
        commentAuthorsById = authorsData.reduce((acc, author) => {
          acc[author.id] = `${author.first_name || ''} ${author.last_name || ''}`.trim();
          return acc;
        }, {} as Record<string, string>);
      }
    }

    const mappedEvents = eventsData?.map((e: any) => ({
      id: `event-${e.id}`,
      title: e.title,
      description: e.description,
      eventType: e.event_type,
      eventDate: e.event_date,
      projectName: e.projects?.title ?? 'Unknown Project',
    })) ?? [];

    const mappedComments = commentsData?.map((c: any) => {
      const authorName = c.user_id ? (commentAuthorsById[c.user_id] || 'Unknown User') : 'System';
      return {
        id: `comment-${c.id}`,
        title: `Comment from ${authorName}`,
        description: c.content,
        eventType: 'comment',
        eventDate: c.created_at,
        projectName: c.projects?.title ?? 'Unknown Project',
      };
    }) ?? [];

    combinedActivity = [...mappedEvents, ...mappedComments]
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, 5);
  }

  const projects: Project[] = projectsData
    ? projectsData.map((p: any) => ({
        id: p.id,
        name: p.title,
        status: p.status || 'N/A',
        priority: p.priority || 'N/A',
        startDate: p.start_date,
        endDate: p.target_date,
        hoursLogged: metadataByProject[p.id]?.hoursLogged ?? 0,
        estimatedHours: metadataByProject[p.id]?.estimatedHours ?? 0,
        purchasedHours: metadataByProject[p.id]?.purchasedHours ?? 0,
        tags: metadataByProject[p.id]?.tags ?? [],
      }))
    : [];

  return {
    user,
    company,
    projects,
    events: combinedActivity,
  };
};

export const getProjectDetails = async (projectId: string): Promise<FullProject | null> => {
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, title, status, priority, start_date, target_date, company_id')
    .eq('id', projectId)
    .single();

  if (projectError || !projectData) {
    console.error(`Error fetching project ${projectId}:`, projectError?.message);
    return null;
  }
  
  // Fetch everything in parallel for performance
  const [
    metadataResult,
    commentsResult,
    timeBlocksResult,
    tasksResult,
    contactsResult,
  ] = await Promise.all([
    supabase
      .from('project_metadata')
      .select('estimated_hours, purchased_hours, hours_used, tags')
      .eq('project_id', projectId)
      .single(),
    supabase
      .from('project_comments')
      .select('id, content, created_at, user_id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_time_blocks')
      .select('id, date, hours_logged, completed_items')
      .eq('project_id', projectId)
      .order('date', { ascending: false }),
    supabase
      .from('project_tasks')
      .select('id, title, description, status, due_date, user_id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('company_contacts')
      .select('id, first_name, last_name')
      .eq('company_id', projectData.company_id),
  ]);

  // Process Metadata
  const { data: metadataData, error: metadataError } = metadataResult;
  if (metadataError) console.warn(`Could not fetch metadata for project ${projectId}`, metadataError.message);

  // Process Comments
  const { data: commentsData, error: commentsError } = commentsResult;
  if (commentsError) console.error(`Error fetching comments for project ${projectId}:`, commentsError.message);
  
  const commentAuthorIds = commentsData ? [...new Set(commentsData.map(c => c.user_id).filter(Boolean))] : [];
  let authorsById: Record<string, { name: string; avatarUrl: string }> = {};

  if (commentAuthorIds.length > 0) {
    const { data: authorsData, error: authorsError } = await supabase
      .from('company_contacts')
      .select('id, first_name, last_name, email')
      .in('id', commentAuthorIds);
    
    if (authorsError) console.warn(`Could not fetch comment authors`, authorsError.message);
    else if (authorsData) {
      authorsById = authorsData.reduce((acc, author) => {
        acc[author.id] = {
          name: `${author.first_name || ''} ${author.last_name || ''}`.trim(),
          avatarUrl: `https://placehold.co/128x128.png`,
        };
        return acc;
      }, {} as Record<string, { name: string; avatarUrl: string }>);
    }
  }

  const comments: ProjectComment[] = commentsData?.map(comment => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at,
    author: comment.user_id ? (authorsById[comment.user_id] || { name: 'Unknown User', avatarUrl: 'https://placehold.co/128x128.png' }) : { name: 'System', avatarUrl: 'https://placehold.co/128x128.png' },
  })) ?? [];

  // Process Time Blocks
  const { data: timeBlocksData, error: timeBlocksError } = timeBlocksResult;
  if (timeBlocksError) console.error(`Error fetching time blocks for project ${projectId}:`, timeBlocksError.message);
  
  const timeBlocks: ProjectTimeBlock[] = timeBlocksData?.map(block => ({
      id: block.id,
      date: block.date,
      duration: `${(block.hours_logged || 0).toFixed(2)} hrs`,
      description: block.completed_items,
  })) ?? [];
  
  // Process Tasks
  const { data: tasksData, error: tasksError } = tasksResult;
  if (tasksError) console.error(`Error fetching tasks for project ${projectId}:`, tasksError.message);

  const { data: allContactsData, error: contactsError } = contactsResult;
  if (contactsError) console.error(`Error fetching company contacts:`, contactsError.message);

  const contactsMap = allContactsData?.reduce((acc, contact) => {
    acc[contact.id] = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return acc;
  }, {} as Record<string, string>) ?? {};
  
  const tasks: ProjectTask[] = tasksData?.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.due_date,
    assignee: task.user_id && contactsMap[task.user_id] ? {
        id: task.user_id,
        name: contactsMap[task.user_id],
    } : null,
  })) ?? [];

  const contacts: CompanyContact[] = allContactsData?.map(c => ({
    id: c.id,
    name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
  })) ?? [];

  const project: FullProject = {
    id: projectData.id,
    name: projectData.title,
    status: projectData.status || 'N/A',
    priority: projectData.priority || 'N/A',
    startDate: projectData.start_date,
    endDate: projectData.target_date,
    hoursLogged: metadataData?.hours_used ?? 0,
    estimatedHours: metadataData?.estimated_hours ?? 0,
    purchasedHours: metadataData?.purchased_hours ?? 0,
    tags: metadataData?.tags ?? [],
    comments,
    timeBlocks,
    tasks,
    contacts,
  };
  
  return project;
};

export const addComment = async (projectId: string, userId: string | null, content: string): Promise<any> => {
    const { data, error } = await supabase
        .from('project_comments')
        .insert([{
            project_id: projectId,
            user_id: userId,
            content: content
        }]);
      
    if (error) {
      console.error('Error adding comment:', error.message);
      throw new Error('Failed to add comment.');
    }
    
    return data;
};

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { error } = await supabase
    .from('project_tasks')
    .update({ status: status })
    .eq('id', taskId);
  if (error) throw new Error(`Failed to update task status: ${error.message}`);
}

interface CreateTaskPayload {
    projectId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    userId?: string;
    dueDate?: string;
}

export async function createTask(payload: CreateTaskPayload) {
    const { projectId, title, description, status, userId, dueDate } = payload;
    const { error } = await supabase
        .from('project_tasks')
        .insert([{
            project_id: projectId,
            title,
            description: description || null,
            status,
            user_id: userId || null,
            due_date: dueDate || null
        }]);
    
    if (error) {
        console.error('Error creating task:', error.message);
        throw new Error('Failed to create task.');
    }
}

export const getCompanies = async (): Promise<CompanyWithContacts[]> => {
  const { data: companiesData, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, industry, website, address');

  if (companiesError) {
    console.error('Error fetching companies:', companiesError.message);
    return [];
  }

  const companyIds = companiesData.map((c) => c.id);

  const { data: contactsData, error: contactsError } = await supabase
    .from('company_contacts')
    .select('id, first_name, last_name, email, phone, job_title, company_id')
    .in('company_id', companyIds);

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError.message);
  }

  const contactsByCompany = (contactsData || []).reduce((acc, contact) => {
    if (!acc[contact.company_id]) {
      acc[contact.company_id] = [];
    }
    acc[contact.company_id].push({
        id: contact.id,
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        email: contact.email,
        phone: contact.phone,
        job_title: contact.job_title,
    });
    return acc;
  }, {} as Record<string, CompanyContact[]>);

  return companiesData.map((company) => {
    const primaryContact = (contactsByCompany[company.id] || [])[0];
    return {
        id: company.id,
        name: company.name,
        industry: company.industry,
        website: company.website,
        address: company.address,
        phone: primaryContact?.phone || 'N/A',
        contacts: contactsByCompany[company.id] || [],
    }
  });
};

export const getUserPurchases = async (email: string | null): Promise<AssignedPricebook[]> => {
    if (!email) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('user_assigned_pricebooks')
            .select('product_name, pricebook_url, purchase_date')
            .eq('user_email', email);

        if (error) {
            console.error('Error fetching user purchases from db:', error.message);
            return [];
        }
        
        return data.map(item => ({
            productName: item.product_name,
            pricebookUrl: item.pricebook_url,
            purchaseDate: new Date(item.purchase_date).toLocaleDateString(),
        }));

    } catch (error) {
        console.error('Error in getUserPurchases:', error);
        return [];
    }
};

export async function uploadPricebook(productId: string, file: File) {
    const filePath = `pricebooks/${productId}/${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('pricebooks')
      .upload(filePath, file, {
        upsert: true, // Overwrite if file already exists
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError.message);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('pricebooks')
      .getPublicUrl(filePath);
      
    if (!publicUrlData) {
        throw new Error('Could not get public URL for uploaded file.');
    }

    const { error: dbError } = await supabase
        .from('product_pricebook_assignments')
        .upsert({ product_id: productId, pricebook_url: publicUrlData.publicUrl }, { onConflict: 'product_id' });
    
    if (dbError) {
        console.error('Error saving pricebook assignment to DB:', dbError);
        throw new Error(`Failed to save assignment: ${dbError.message}`);
    }

    return publicUrlData.publicUrl;
}

export async function getPricebookAssignments(): Promise<PricebookAssignment[]> {
    const { data, error } = await supabase
        .from('product_pricebook_assignments')
        .select('product_id, pricebook_url');

    if (error) {
        console.error('Error fetching pricebook assignments:', error.message);
        throw new Error(`Failed to fetch assignments: ${error.message}`);
    }
    return data || [];
}

export async function getProductsWithAssignedPricebooks(): Promise<ProductWithPricebook[]> {
    try {
        const [products, assignments] = await Promise.all([
            getStripeProducts(),
            getPricebookAssignments(),
        ]);

        const assignmentMap = new Map(assignments.map(a => [a.product_id, a.pricebook_url]));

        return products
            .filter(p => assignmentMap.has(p.id))
            .map(p => ({
                ...p,
                pricebookUrl: assignmentMap.get(p.id)!,
            }));
    } catch (error) {
        console.error('Error getting products with assigned assigned pricebooks', error);
        return [];
    }
}

export async function syncUserPricebooksFromStripe() {
  try {
    const [transactions, assignments, allStripeProducts] = await Promise.all([
      getStripeTransactions(),
      getPricebookAssignments(),
      getStripeProducts()
    ]);
    
    const successfulTransactions = transactions.filter(t => (t.status === 'succeeded' || t.status === 'paid') && t.customerEmail);

    if (successfulTransactions.length === 0) {
      return { success: true, message: "No new successful transactions." };
    }
    
    const pricebookMap = new Map(assignments.map(a => [a.product_id, a.pricebook_url]));
    const productsWithPricebooks = allStripeProducts.filter(p => pricebookMap.has(p.id));
    const productNameMap = new Map(productsWithPricebooks.map(p => [p.name.toLowerCase(), { url: pricebookMap.get(p.id)!, name: p.name }]));

    let assignmentsToInsert = [];
    let processedTxnIds = new Set<string>();

    // 1. Primary method: Match by Product ID
    for (const txn of successfulTransactions) {
      if (txn.productId && pricebookMap.has(txn.productId)) {
        assignmentsToInsert.push({
          user_email: txn.customerEmail!,
          stripe_transaction_id: txn.id,
          product_name: allStripeProducts.find(p => p.id === txn.productId)?.name || 'Unknown Product',
          pricebook_url: pricebookMap.get(txn.productId!)!,
          purchase_date: new Date(txn.created * 1000).toISOString(),
        });
        processedTxnIds.add(txn.id);
      }
    }

    // 2. Fallback method: Match by Description for remaining transactions
    const remainingTransactions = successfulTransactions.filter(txn => !processedTxnIds.has(txn.id));
    for (const txn of remainingTransactions) {
        if (txn.description) {
            const matchedProduct = productNameMap.get(txn.description.toLowerCase());
            if (matchedProduct) {
                 assignmentsToInsert.push({
                    user_email: txn.customerEmail!,
                    stripe_transaction_id: txn.id,
                    product_name: matchedProduct.name,
                    pricebook_url: matchedProduct.url,
                    purchase_date: new Date(txn.created * 1000).toISOString(),
                });
                processedTxnIds.add(txn.id);
            }
        }
    }


    if (assignmentsToInsert.length > 0) {
      const { error } = await supabase
        .from('user_assigned_pricebooks')
        .upsert(assignmentsToInsert, { onConflict: 'stripe_transaction_id' });

      if (error) {
        console.error('Error inserting user pricebook assignments:', error.message);
        throw new Error(`DB Error: ${error.message}`);
      }
    }
    
    return { success: true, message: `Sync completed. Processed ${assignmentsToInsert.length} assignments.` };
  } catch (error: any) {
    console.error('Error syncing user pricebooks:', error);
    return { success: false, message: `Sync failed: ${error.message}` };
  }
}
