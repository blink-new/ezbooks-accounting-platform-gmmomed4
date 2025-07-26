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
  description: string;
}

// Comprehensive accounting knowledge sources
const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  // IRS Publications - High Priority
  {
    name: "IRS Publication 334 - Tax Guide for Small Business",
    url: "https://www.irs.gov/pub/irs-pdf/p334.pdf",
    category: "Tax Compliance",
    priority: 1,
    description: "Comprehensive tax guide for small businesses"
  },
  {
    name: "IRS Publication 535 - Business Expenses",
    url: "https://www.irs.gov/pub/irs-pdf/p535.pdf",
    category: "Tax Compliance",
    priority: 1,
    description: "Guide to deductible business expenses"
  },
  {
    name: "IRS Publication 946 - How to Depreciate Property",
    url: "https://www.irs.gov/pub/irs-pdf/p946.pdf",
    category: "Tax Compliance",
    priority: 1,
    description: "Depreciation methods and calculations"
  },
  
  // GAAP and Professional Standards
  {
    name: "FASB Accounting Standards Codification Overview",
    url: "https://www.fasb.org/page/PageContent?pageId=/standards/accounting-standards-codification.html",
    category: "GAAP Standards",
    priority: 1,
    description: "Generally Accepted Accounting Principles"
  },
  
  // Educational Resources
  {
    name: "OpenStax Principles of Accounting Volume 1",
    url: "https://openstax.org/books/principles-financial-accounting/pages/1-introduction",
    category: "Accounting Fundamentals",
    priority: 2,
    description: "Comprehensive accounting textbook"
  },
  {
    name: "OpenStax Principles of Accounting Volume 2",
    url: "https://openstax.org/books/principles-managerial-accounting/pages/1-introduction",
    category: "Managerial Accounting",
    priority: 2,
    description: "Managerial accounting principles"
  },
  
  // SBA Resources
  {
    name: "SBA Financial Management Guide",
    url: "https://www.sba.gov/business-guide/manage-your-business/financial-management",
    category: "Business Management",
    priority: 2,
    description: "Small business financial management"
  },
  {
    name: "SBA Accounting Basics",
    url: "https://www.sba.gov/business-guide/manage-your-business/accounting-bookkeeping",
    category: "Accounting Fundamentals",
    priority: 2,
    description: "Basic accounting and bookkeeping principles"
  },
  
  // Professional Resources
  {
    name: "AICPA Code of Professional Conduct",
    url: "https://www.aicpa.org/resources/download/code-of-professional-conduct-pdf",
    category: "Professional Standards",
    priority: 2,
    description: "Professional ethics and conduct standards"
  },
  
  // Specialized Topics
  {
    name: "Cash Flow Management Guide",
    url: "https://www.score.org/resource/cash-flow-management-guide",
    category: "Cash Flow",
    priority: 3,
    description: "Managing business cash flow effectively"
  },
  {
    name: "Financial Ratio Analysis",
    url: "https://www.investopedia.com/articles/fundamental-analysis/09/five-must-have-metrics-value-investors.asp",
    category: "Financial Analysis",
    priority: 3,
    description: "Key financial ratios and analysis techniques"
  },
  {
    name: "Internal Controls Framework",
    url: "https://www.coso.org/guidance-internal-control",
    category: "Internal Controls",
    priority: 3,
    description: "COSO internal control framework"
  }
];

async function scrapeKnowledgeSource(source: KnowledgeSource): Promise<void> {
  try {
    console.log(`Scraping: ${source.name}`);
    
    // Use Blink's data extraction to get content
    let content: string;
    
    try {
      // Try to extract from URL
      content = await blink.data.extractFromUrl(source.url, {
        chunking: true,
        chunkSize: 2000
      }) as string;
      
      if (Array.isArray(content)) {
        // If chunked, process each chunk
        for (let i = 0; i < content.length; i++) {
          await saveKnowledgeChunk(source, content[i], i, content.length);
        }
      } else {
        // Single content piece
        await saveKnowledgeChunk(source, content, 0, 1);
      }
      
    } catch (extractError) {
      console.log(`Direct extraction failed for ${source.name}, trying web scraping...`);
      
      // Fallback to web scraping
      const scrapeResult = await blink.data.scrape(source.url);
      content = scrapeResult.markdown || scrapeResult.extract?.text || '';
      
      if (content) {
        // Chunk the content manually
        const chunks = chunkContent(content, 2000);
        for (let i = 0; i < chunks.length; i++) {
          await saveKnowledgeChunk(source, chunks[i], i, chunks.length);
        }
      }
    }
    
    console.log(`✅ Successfully scraped: ${source.name}`);
    
  } catch (error) {
    console.error(`❌ Failed to scrape ${source.name}:`, error);
  }
}

function chunkContent(content: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const words = content.split(' ');
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
}

async function saveKnowledgeChunk(
  source: KnowledgeSource, 
  content: string, 
  chunkIndex: number, 
  totalChunks: number
): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    await blink.db.knowledge_base.create({
      id: `${source.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${chunkIndex}`,
      source_name: source.name,
      source_url: source.url,
      category: source.category,
      priority: source.priority,
      content: content.trim(),
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      created_at: now,
      updated_at: now
    });
    
  } catch (error) {
    console.error(`Failed to save chunk ${chunkIndex} for ${source.name}:`, error);
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
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'scrape_all';
    
    if (action === 'scrape_all') {
      console.log('🚀 Starting comprehensive knowledge scraping...');
      
      // Process high priority sources first
      const highPriority = KNOWLEDGE_SOURCES.filter(s => s.priority === 1);
      const mediumPriority = KNOWLEDGE_SOURCES.filter(s => s.priority === 2);
      const lowPriority = KNOWLEDGE_SOURCES.filter(s => s.priority === 3);
      
      // Process in batches to avoid overwhelming the system
      for (const source of highPriority) {
        await scrapeKnowledgeSource(source);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      for (const source of mediumPriority) {
        await scrapeKnowledgeSource(source);
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      }
      
      for (const source of lowPriority) {
        await scrapeKnowledgeSource(source);
        await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second delay
      }
      
      // Get final count
      const knowledgeCount = await blink.db.knowledge_base.list();
      
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully scraped ${KNOWLEDGE_SOURCES.length} knowledge sources`,
        totalEntries: knowledgeCount.length,
        sources: KNOWLEDGE_SOURCES.map(s => ({
          name: s.name,
          category: s.category,
          priority: s.priority
        }))
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
      
    } else if (action === 'status') {
      // Return knowledge base status
      const knowledgeEntries = await blink.db.knowledge_base.list();
      const categories = [...new Set(knowledgeEntries.map(entry => entry.category))];
      const sources = [...new Set(knowledgeEntries.map(entry => entry.source_name))];
      
      return new Response(JSON.stringify({
        success: true,
        totalEntries: knowledgeEntries.length,
        totalSources: sources.length,
        categories: categories,
        sources: sources
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Invalid action. Use ?action=scrape_all or ?action=status'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Knowledge scraper error:', error);
    
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