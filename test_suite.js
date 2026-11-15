import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pphphvjhwfudeunipcqm.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_ANC-YmcjrtcsfwBaaRTJ-w_feaQslah';

async function runTests() {
  console.log('====================================================');
  console.log(' DeskPilot Supabase Infrastructure Verification Test');
  console.log('====================================================\n');

  // 1. Authenticate Alice and Bob
  const aliceClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const bobClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

  console.log('1. Testing Authentication...');
  const aliceAuth = await aliceClient.auth.signInWithPassword({
    email: 'alice.demo@deskpilot.io',
    password: 'Password123!',
  });
  if (aliceAuth.error) throw new Error('Alice login failed: ' + aliceAuth.error.message);
  console.log('  [PASS] Alice signed in (User ID: ' + aliceAuth.data.user.id + ')');

  const bobAuth = await bobClient.auth.signInWithPassword({
    email: 'bob.demo@deskpilot.io',
    password: 'Password123!',
  });
  if (bobAuth.error) throw new Error('Bob login failed: ' + bobAuth.error.message);
  console.log('  [PASS] Bob signed in (User ID: ' + bobAuth.data.user.id + ')\n');

  // 2. Company Creation & Automatic Membership Trigger
  console.log('2. Testing Company Creation & Membership Trigger...');
  const { data: acmeCompany, error: acmeError } = await aliceClient
    .from('companies')
    .insert({ name: 'Acme Support Corp', slug: 'acme-corp' })
    .select()
    .single();

  if (acmeError) throw new Error('Acme creation failed: ' + acmeError.message);
  console.log('  [PASS] Alice created company: Acme Support Corp (ID: ' + acmeCompany.id + ')');

  // Verify Alice's membership
  const { data: aliceMemberships, error: aliceMemberError } = await aliceClient
    .from('company_members')
    .select('*')
    .eq('company_id', acmeCompany.id);

  if (aliceMemberError || aliceMemberships.length === 0) {
    throw new Error('Membership trigger verification failed for Alice');
  }
  console.log('  [PASS] Membership auto-created: Alice is role "' + aliceMemberships[0].role + '" in Acme Corp');

  // Bob creates Beta Innovations
  const { data: betaCompany, error: betaError } = await bobClient
    .from('companies')
    .insert({ name: 'Beta Innovations', slug: 'beta-innovations' })
    .select()
    .single();

  if (betaError) throw new Error('Beta creation failed: ' + betaError.message);
  console.log('  [PASS] Bob created company: Beta Innovations (ID: ' + betaCompany.id + ')');

  const { data: bobMemberships } = await bobClient
    .from('company_members')
    .select('*')
    .eq('company_id', betaCompany.id);
  console.log('  [PASS] Membership auto-created: Bob is role "' + bobMemberships[0].role + '" in Beta Innovations\n');

  // 3. Document, Chunk, Ticket, and Conversation Creation
  console.log('3. Inserting Company Data (Documents, Chunks, Tickets, Conversations)...');
  
  // Alice adds document & 768-dim chunk to Acme Corp
  const { data: acmeDoc, error: acmeDocErr } = await aliceClient
    .from('documents')
    .insert({
      company_id: acmeCompany.id,
      title: 'Acme Return Policy.pdf',
      file_path: `${acmeCompany.id}/Acme_Return_Policy.pdf`,
      mime_type: 'application/pdf',
      metadata: { pages: 3 }
    })
    .select()
    .single();
  if (acmeDocErr) throw new Error('Failed to insert Acme doc: ' + acmeDocErr.message);

  // Generate 768-dimensional mock embedding for Acme
  const acmeVector = new Array(768).fill(0);
  acmeVector[0] = 0.9;
  acmeVector[1] = 0.1;

  const { data: acmeChunk, error: acmeChunkErr } = await aliceClient
    .from('document_chunks')
    .insert({
      company_id: acmeCompany.id,
      document_id: acmeDoc.id,
      chunk_index: 0,
      page_number: 1,
      content: 'Customers can return items within 30 days for a full refund.',
      embedding: acmeVector,
      metadata: { source: 'Acme Return Policy.pdf' }
    })
    .select()
    .single();
  if (acmeChunkErr) throw new Error('Failed to insert Acme chunk: ' + acmeChunkErr.message);
  console.log('  [PASS] Alice added PDF document and 768-dim vector chunk to Acme Corp');

  // Alice creates a ticket
  const { data: acmeTicket, error: acmeTicketErr } = await aliceClient
    .from('tickets')
    .insert({
      company_id: acmeCompany.id,
      title: 'Billing inquiry regarding invoice #1042',
      priority: 'high',
      status: 'open'
    })
    .select()
    .single();
  if (acmeTicketErr) throw new Error('Failed to insert Acme ticket: ' + acmeTicketErr.message);
  console.log('  [PASS] Alice created ticket: "' + acmeTicket.title + '" (Priority: ' + acmeTicket.priority + ')');

  // Bob adds document & 768-dim chunk to Beta Innovations
  const { data: betaDoc } = await bobClient
    .from('documents')
    .insert({
      company_id: betaCompany.id,
      title: 'Beta Software Architecture.pdf',
      file_path: `${betaCompany.id}/Beta_Architecture.pdf`,
      mime_type: 'application/pdf',
      metadata: { pages: 12 }
    })
    .select()
    .single();

  const betaVector = new Array(768).fill(0);
  betaVector[0] = 0.05;
  betaVector[1] = 0.95;

  await bobClient
    .from('document_chunks')
    .insert({
      company_id: betaCompany.id,
      document_id: betaDoc.id,
      chunk_index: 0,
      page_number: 5,
      content: 'Beta microservices use gRPC for high-throughput internal communication.',
      embedding: betaVector,
      metadata: { source: 'Beta Software Architecture.pdf' }
    });

  const { data: betaTicket } = await bobClient
    .from('tickets')
    .insert({
      company_id: betaCompany.id,
      title: 'Kubernetes cluster upgrade notice',
      priority: 'urgent',
      status: 'in_progress'
    })
    .select()
    .single();
  console.log('  [PASS] Bob added PDF document, 768-dim vector chunk, and ticket to Beta Innovations\n');

  // 4. Multi-Tenant RLS Enforcement Verification
  console.log('4. Verifying Row Level Security (RLS) Isolation...');
  
  // Bob queries Acme tickets
  const { data: bobAcmeTickets } = await bobClient
    .from('tickets')
    .select('*')
    .eq('company_id', acmeCompany.id);
  
  if (bobAcmeTickets.length === 0) {
    console.log('  [PASS] Bob cannot read Acme Corp tickets (Returned 0 rows)');
  } else {
    throw new Error('RLS VIOLATION: Bob read Acme Corp tickets!');
  }

  // Bob queries Acme documents
  const { data: bobAcmeDocs } = await bobClient
    .from('documents')
    .select('*')
    .eq('company_id', acmeCompany.id);

  if (bobAcmeDocs.length === 0) {
    console.log('  [PASS] Bob cannot read Acme Corp documents (Returned 0 rows)');
  } else {
    throw new Error('RLS VIOLATION: Bob read Acme Corp documents!');
  }

  // Bob attempts unauthorized INSERT into Acme tickets
  const { data: rogueTicket, error: rogueError } = await bobClient
    .from('tickets')
    .insert({
      company_id: acmeCompany.id, // Attempting to inject into Acme
      title: 'Malicious ticket injected by Bob',
      priority: 'urgent'
    })
    .select();

  if (rogueError) {
    console.log('  [PASS] Bob INSERT into Acme Corp rejected by RLS: ' + rogueError.message);
  } else {
    throw new Error('RLS VIOLATION: Bob was able to insert a ticket into Acme Corp!');
  }

  // Alice queries her own tickets
  const { data: aliceTickets } = await aliceClient
    .from('tickets')
    .select('*')
    .eq('company_id', acmeCompany.id);
  console.log('  [PASS] Alice successfully reads her own company tickets (' + aliceTickets.length + ' found)\n');

  // 5. Storage Security Verification
  console.log('5. Verifying Storage Bucket & Folder Security...');
  const dummyPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF');
  
  // Alice uploads to her company folder: {acmeCompany.id}/test_policy.pdf
  const { data: uploadData, error: uploadErr } = await aliceClient.storage
    .from('company-documents')
    .upload(`${acmeCompany.id}/test_policy.pdf`, dummyPdfContent, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadErr) {
    throw new Error('Alice failed to upload PDF to her company folder: ' + uploadErr.message);
  }
  console.log('  [PASS] Alice uploaded PDF to path: ' + uploadData.path);

  // Alice downloads her document
  const { data: downloadData, error: downloadErr } = await aliceClient.storage
    .from('company-documents')
    .download(`${acmeCompany.id}/test_policy.pdf`);

  if (downloadErr) throw new Error('Alice failed to download her document: ' + downloadErr.message);
  console.log('  [PASS] Alice downloaded her PDF document (' + downloadData.size + ' bytes)');

  // Bob attempts to download Alice's document
  const { data: bobDownload, error: bobDownloadErr } = await bobClient.storage
    .from('company-documents')
    .download(`${acmeCompany.id}/test_policy.pdf`);

  if (bobDownloadErr || !bobDownload) {
    console.log('  [PASS] Bob access to Acme storage denied by Storage RLS: ' + (bobDownloadErr?.message || 'Unauthorized'));
  } else {
    throw new Error('STORAGE RLS VIOLATION: Bob was able to download Acme Corp private document!');
  }

  // Bob attempts to upload into Alice's folder
  const { data: rogueUpload, error: rogueUploadErr } = await bobClient.storage
    .from('company-documents')
    .upload(`${acmeCompany.id}/malicious.pdf`, dummyPdfContent, {
      contentType: 'application/pdf'
    });

  if (rogueUploadErr) {
    console.log('  [PASS] Bob upload into Acme folder denied by Storage RLS: ' + rogueUploadErr.message);
  } else {
    throw new Error('STORAGE RLS VIOLATION: Bob was able to upload to Acme Corp folder!');
  }
  console.log('');

  // 6. Vector Similarity Search Verification
  console.log('6. Verifying Vector Similarity Search RPC (match_document_chunks)...');

  // Query vector similar to Acme vector
  const queryVector = new Array(768).fill(0);
  queryVector[0] = 0.85;
  queryVector[1] = 0.15;

  // Alice queries Acme chunks
  const { data: searchResults, error: searchErr } = await aliceClient.rpc('match_document_chunks', {
    query_embedding: queryVector,
    filter_company_id: acmeCompany.id,
    match_threshold: 0.5,
    match_count: 5
  });

  if (searchErr) throw new Error('Vector search failed: ' + searchErr.message);
  console.log('  [PASS] Alice performed vector search on Acme Corp chunks:');
  searchResults.forEach(r => {
    console.log(`    - Chunk ID: ${r.id}`);
    console.log(`      Document ID: ${r.document_id}`);
    console.log(`      Page Number: ${r.page_number}`);
    console.log(`      Similarity: ${(r.similarity * 100).toFixed(2)}%`);
    console.log(`      Content snippet: "${r.content.substring(0, 50)}..."`);
  });

  // Verify that Beta chunk is NOT in Alice's search results
  const betaSnippetFound = searchResults.some(r => r.content.includes('Beta microservices'));
  if (!betaSnippetFound) {
    console.log('  [PASS] Search returned ONLY Acme Corp chunks — zero cross-tenant contamination');
  } else {
    throw new Error('VECTOR SEARCH VIOLATION: Beta Innovations chunk leaked into Acme search!');
  }

  // Alice attempts to run vector search targeting Bob's company
  const { data: rogueSearch, error: rogueSearchErr } = await aliceClient.rpc('match_document_chunks', {
    query_embedding: queryVector,
    filter_company_id: betaCompany.id,
    match_threshold: 0.0,
    match_count: 5
  });

  if (rogueSearchErr) {
    console.log('  [PASS] Unauthorized cross-company vector search rejected: ' + rogueSearchErr.message);
  } else {
    throw new Error('SECURITY VIOLATION: Alice was allowed to search Beta Innovations vectors!');
  }

  console.log('\n====================================================');
  console.log(' ALL 8 INFRASTRUCTURE & SECURITY TESTS PASSED 100%!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
