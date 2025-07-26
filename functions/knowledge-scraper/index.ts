import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

interface KnowledgeSource {
  name: string;
  url: string;
  category: string;
  priority: number;
}

const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  // IRS Publications
  {
    name: "IRS Publication 334 - Tax Guide for Small Business",
    url: "https://www.irs.gov/pub/irs-pdf/p334.pdf",
    category: "Tax Compliance",
    priority: 1
  },
  {
    name: "IRS Publication 535 - Business Expenses",
    url: "https://www.irs.gov/pub/irs-pdf/p535.pdf",
    category: "Tax Compliance",
    priority: 1
  },
  {
    name: "IRS Publication 946 - How to Depreciate Property",
    url: "https://www.irs.gov/pub/irs-pdf/p946.pdf",
    category: "Tax Compliance",
    priority: 1
  },
  
  // Educational Resources
  {
    name: "OpenStax Principles of Accounting Volume 1",
    url: "https://openstax.org/books/principles-financial-accounting/pages/1-introduction",
    category: "Accounting Principles",
    priority: 2
  },
  {
    name: "Khan Academy - Accounting and Financial Statements",
    url: "https://www.khanacademy.org/economics-finance-domain/core-finance/accounting-and-financial-stateme",
    category: "Accounting Principles",
    priority: 2
  },
  
  // Government Resources
  {
    name: "SBA - Managing Your Finances",
    url: "https://www.sba.gov/business-guide/manage-your-business/manage-your-finances",
    category: "Business Finance",
    priority: 2
  },
  {
    name: "SCORE - Financial Management",
    url: "https://www.score.org/resource/collection/financial-management",
    category: "Business Finance",
    priority: 2
  },
  
  // Professional Standards
  {
    name: "FASB Accounting Standards Codification",
    url: "https://www.fasb.org/page/PageContent?pageId=/standards/accounting-standards-codification.html",
    category: "GAAP Standards",
    priority: 1
  },
  {
    name: "AICPA Professional Standards",
    url: "https://www.aicpa.org/resources/download/professional-standards-integrated-practice-system",
    category: "Professional Standards",
    priority: 1
  }
];

async function scrapeKnowledgeSource(source: KnowledgeSource): Promise<void> {
  try {
    console.log(`Scraping: ${source.name}`);
    
    // Use Blink's data extraction to get content
    const content = await blink.data.extractFromUrl(source.url, {
      chunking: true,
      chunkSize: 2000
    });
    
    // If content is an array (chunked), process each chunk
    if (Array.isArray(content)) {
      for (let i = 0; i < content.length; i++) {
        const chunk = content[i];
        const id = `${source.name.toLowerCase().replace(/\s+/g, '_')}_chunk_${i}`;
        
        await blink.db.knowledgeBase.create({
          id,
          sourceName: source.name,
          sourceUrl: source.url,
          category: source.category,
          priority: source.priority,
          content: chunk,
          chunkIndex: i,
          totalChunks: content.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      // Single content piece
      const id = `${source.name.toLowerCase().replace(/\s+/g, '_')}_single`;
      
      await blink.db.knowledgeBase.create({
        id,
        sourceName: source.name,
        sourceUrl: source.url,
        category: source.category,
        priority: source.priority,
        content: content,
        chunkIndex: 0,
        totalChunks: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log(`✅ Successfully scraped: ${source.name}`);
  } catch (error) {
    console.error(`❌ Failed to scrape ${source.name}:`, error);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    console.log('🚀 Starting knowledge base scraping...');
    
    // Clear existing knowledge base
    await blink.db.knowledgeBase.list().then(async (existing) => {
      for (const item of existing) {
        await blink.db.knowledgeBase.delete(item.id);
      }
    });
    
    console.log('🧹 Cleared existing knowledge base');
    
    // Scrape all sources
    for (const source of KNOWLEDGE_SOURCES) {
      await scrapeKnowledgeSource(source);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Get final count
    const knowledgeItems = await blink.db.knowledgeBase.list();
    
    console.log(`✅ Knowledge base populated with ${knowledgeItems.length} items`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Knowledge base populated with ${knowledgeItems.length} items`,
      sources: KNOWLEDGE_SOURCES.length,
      categories: [...new Set(KNOWLEDGE_SOURCES.map(s => s.category))]
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('❌ Knowledge scraping failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});