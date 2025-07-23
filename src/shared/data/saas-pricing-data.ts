export interface SaaSPricingTier {
  product: string;
  entry_level: string;
  mid_tier: string;
  enterprise: string;
  notes: string;
}

export const saasPricingData: SaaSPricingTier[] = [
  {
    product: "Microsoft 365",
    entry_level: "Business Basic – $6 user/mo (annual)",
    mid_tier: "Business Standard – $12.50 user/mo; Business Premium – $22 user/mo (annual)",
    enterprise: "Copilot add-on $30 user/mo; enterprise E3 $36 user/mo, E5 $57 user/mo",
    notes: "5% surcharge on monthly-billed annual NCE plans begins Apr 2025"
  },
  {
    product: "Google Workspace",
    entry_level: "Business Starter – $7 user/mo (annual) or $8.40 user/mo (monthly)",
    mid_tier: "Business Standard – $14 user/mo (annual) or $16.80 monthly; Business Plus – $22 annual / $26.40 monthly",
    enterprise: "Enterprise – custom quote (unpublished)",
    notes: "20% price rise that began rolling out in 2024 now applies to all customers"
  },
  {
    product: "Slack",
    entry_level: "Free plan – $0",
    mid_tier: "Pro – $7.25 user/mo (annual) or $8.75 monthly",
    enterprise: "Business+ – $12.50 user/mo (annual); Enterprise Grid – custom quote",
    notes: "Prices include AI features added Jan 2025; new Enterprise+ plan forthcoming"
  },
  {
    product: "Salesforce (Sales Cloud)",
    entry_level: "Starter Suite – $25 user/mo",
    mid_tier: "Professional – $100 user/mo; Enterprise – $165 user/mo",
    enterprise: "Unlimited – $330 user/mo; Einstein 1 Sales – $500 user/mo; new Agentforce Flex Credits $0.10 per agent action",
    notes: "List prices rise ~6% on Aug 1 2025 for Enterprise & Unlimited editions"
  },
  {
    product: "Atlassian (Jira + Confluence)",
    entry_level: "Jira & Confluence Free – up to 10 users, $0",
    mid_tier: "Jira Standard – $7.53 user/mo; Jira Premium – $13.53 user/mo; Confluence Standard – $5.16 user/mo; Confluence Premium – $9.73 user/mo",
    enterprise: "Atlassian Analytics included only in Enterprise plans (custom quote); Data Center licences from $44,000/yr (Jira) / $28,000/yr (Confluence)",
    notes: "Cloud list prices to rise 5–10% (Standard) & 10% (Premium/Enterprise) on Oct 16 2024; Data Center list up 15–25% on Feb 11 2025"
  },
  {
    product: "Adobe Creative Cloud",
    entry_level: "Individual All-Apps (annual) $69.99/mo or $779.99/yr; month-to-month $104.99/mo after Jun 17 2025",
    mid_tier: "Teams (Creative Cloud for Teams) $99.99 license/mo; new Creative Cloud Pro for Teams $104.99/mo",
    enterprise: "Enterprise pricing varies; education volume licence ≈ $5 user/yr (EDU)",
    notes: "June 2025 rebrand adds 'Pro' tier with ~16–18% price hike for individuals"
  },
  {
    product: "Zoom Workplace (Meetings)",
    entry_level: "Basic – Free (40-min limit)",
    mid_tier: "Pro – $13.33 user/mo annual (or $14.99 monthly); Business – $21.99 user/mo",
    enterprise: "Business Plus – $22.49 user/mo; Webinars from $79 host/mo; Zoom Rooms $49 room/mo",
    notes: "AI Companion included on paid Workplace plans at no extra cost"
  },
  {
    product: "AWS Cost Explorer",
    entry_level: "Web UI usage – Free",
    mid_tier: "API access – $0.01 per paginated request",
    enterprise: "Hourly-granularity data – $0.00000033 per usage record per day (~$0.01 per 1,000 records / month)",
    notes: "No way to disable once enabled; charges mainly affect heavy automation users"
  },
  {
    product: "Azure Cost Management",
    entry_level: "All Cost Management features for Azure resources – Free",
    mid_tier: "Native tool; no direct per-user charge. Costs arise only from underlying Azure services consumed",
    enterprise: "Third-party multi-cloud optimizers (e.g., CloudHealth) add extra licence fees (varies)",
    notes: "Azure advises rightsizing & reserved instances for up to 72% savings"
  }
];

// Utility functions for pricing analysis
export const getPricingByProduct = (productName: string): SaaSPricingTier | undefined => {
  return saasPricingData.find(item => 
    item.product.toLowerCase().includes(productName.toLowerCase())
  );
};

export const getProductsByCategory = () => {
  return {
    communication: saasPricingData.filter(item => 
      ['Slack', 'Zoom', 'Microsoft 365'].some(product => 
        item.product.includes(product)
      )
    ),
    productivity: saasPricingData.filter(item => 
      ['Microsoft 365', 'Google Workspace'].some(product => 
        item.product.includes(product)
      )
    ),
    projectManagement: saasPricingData.filter(item => 
      item.product.includes('Atlassian')
    ),
    crm: saasPricingData.filter(item => 
      item.product.includes('Salesforce')
    ),
    creative: saasPricingData.filter(item => 
      item.product.includes('Adobe')
    ),
    cloudServices: saasPricingData.filter(item => 
      ['AWS', 'Azure'].some(product => 
        item.product.includes(product)
      )
    )
  };
};

// Extract numeric pricing for cost calculations
export const extractPricing = (pricingText: string): number[] => {
  const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
  const matches = pricingText.match(priceRegex);
  return matches ? matches.map(price => parseFloat(price.replace('$', ''))) : [];
};

// Get benchmark pricing ranges
export const getPricingBenchmarks = () => {
  return {
    communication: {
      entry: [0, 15],
      mid: [7, 22],
      enterprise: [12, 50]
    },
    productivity: {
      entry: [6, 8],
      mid: [12, 22],
      enterprise: [22, 57]
    },
    projectManagement: {
      entry: [0, 0],
      mid: [5, 14],
      enterprise: [28000, 44000] // Annual pricing for Data Center
    },
    crm: {
      entry: [25, 25],
      mid: [100, 165],
      enterprise: [330, 500]
    },
    creative: {
      entry: [70, 105],
      mid: [100, 105],
      enterprise: [5, 200] // Wide range due to education vs enterprise
    }
  };
};

export default saasPricingData;