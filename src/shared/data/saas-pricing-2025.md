# Current Pricing Snapshot for Key SaaS Platforms (July 2025)

## Structured Pricing Data

```json
[
    {
        "product": "Microsoft 365",
        "entry_level": "Business Basic – $6 user/mo (annual)",
        "mid_tier": "Business Standard – $12.50 user/mo; Business Premium – $22 user/mo (annual)",
        "enterprise": "Copilot add-on $30 user/mo; enterprise E3 $36 user/mo, E5 $57 user/mo",
        "notes": "5% surcharge on monthly-billed annual NCE plans begins Apr 2025"
    },
    {
        "product": "Google Workspace",
        "entry_level": "Business Starter – $7 user/mo (annual) or $8.40 user/mo (monthly)",
        "mid_tier": "Business Standard – $14 user/mo (annual) or $16.80 monthly; Business Plus – $22 annual / $26.40 monthly",
        "enterprise": "Enterprise – custom quote (unpublished)",
        "notes": "20% price rise that began rolling out in 2024 now applies to all customers"
    },
    {
        "product": "Slack",
        "entry_level": "Free plan – $0",
        "mid_tier": "Pro – $7.25 user/mo (annual) or $8.75 monthly",
        "enterprise": "Business+ – $12.50 user/mo (annual); Enterprise Grid – custom quote",
        "notes": "Prices include AI features added Jan 2025; new Enterprise+ plan forthcoming"
    },
    {
        "product": "Salesforce (Sales Cloud)",
        "entry_level": "Starter Suite – $25 user/mo",
        "mid_tier": "Professional – $100 user/mo; Enterprise – $165 user/mo",
        "enterprise": "Unlimited – $330 user/mo; Einstein 1 Sales – $500 user/mo; new Agentforce Flex Credits $0.10 per agent action",
        "notes": "List prices rise ~6% on Aug 1 2025 for Enterprise & Unlimited editions"
    },
    {
        "product": "Atlassian (Jira + Confluence)",
        "entry_level": "Jira & Confluence Free – up to 10 users, $0",
        "mid_tier": "Jira Standard – $7.53 user/mo; Jira Premium – $13.53 user/mo; Confluence Standard – $5.16 user/mo; Confluence Premium – $9.73 user/mo",
        "enterprise": "Atlassian Analytics included only in Enterprise plans (custom quote); Data Center licences from $44,000/yr (Jira) / $28,000/yr (Confluence)",
        "notes": "Cloud list prices to rise 5–10% (Standard) & 10% (Premium/Enterprise) on Oct 16 2024; Data Center list up 15–25% on Feb 11 2025"
    },
    {
        "product": "Adobe Creative Cloud",
        "entry_level": "Individual All-Apps (annual) $69.99/mo or $779.99/yr; month-to-month $104.99/mo after Jun 17 2025",
        "mid_tier": "Teams (Creative Cloud for Teams) $99.99 license/mo; new Creative Cloud Pro for Teams $104.99/mo",
        "enterprise": "Enterprise pricing varies; education volume licence ≈ $5 user/yr (EDU)",
        "notes": "June 2025 rebrand adds "Pro" tier with ~16–18% price hike for individuals"
    },
    {
        "product": "Zoom Workplace (Meetings)",
        "entry_level": "Basic – Free (40-min limit)",
        "mid_tier": "Pro – $13.33 user/mo annual (or $14.99 monthly); Business – $21.99 user/mo",
        "enterprise": "Business Plus – $22.49 user/mo; Webinars from $79 host/mo; Zoom Rooms $49 room/mo",
        "notes": "AI Companion included on paid Workplace plans at no extra cost"
    },
    {
        "product": "AWS Cost Explorer",
        "entry_level": "Web UI usage – Free",
        "mid_tier": "API access – $0.01 per paginated request",
        "enterprise": "Hourly-granularity data – $0.00000033 per usage record per day (~$0.01 per 1,000 records / month)",
        "notes": "No way to disable once enabled; charges mainly affect heavy automation users"
    },
    {
        "product": "Azure Cost Management",
        "entry_level": "All Cost Management features for Azure resources – Free",
        "mid_tier": "Native tool; no direct per-user charge. Costs arise only from underlying Azure services consumed",
        "enterprise": "Third-party multi-cloud optimizers (e.g., CloudHealth) add extra licence fees (varies)",
        "notes": "Azure advises rightsizing & reserved instances for up to 72% savings"
    }
]
```

## Key Insights for Cost Analysis

### 1. Pricing Tier Patterns
- **Entry Level**: $0-$25/user/mo (most tools offer free tiers or low-cost entry points)
- **Mid Tier**: $7-$100/user/mo (business-focused features and increased limits)
- **Enterprise**: $22-$500/user/mo (advanced features, analytics, unlimited usage)

### 2. Cost Categories by Function

#### Communication & Collaboration ($0-$22/user/mo)
- Slack: $0 → $7.25 → $12.50
- Microsoft Teams (M365): $6 → $12.50 → $22
- Zoom: $0 → $13.33 → $21.99

#### Productivity Suites ($6-$57/user/mo)
- Microsoft 365: $6 → $12.50/$22 → $36/$57
- Google Workspace: $7 → $14 → $22

#### Development & Project Management ($0-$13.53/user/mo)
- Atlassian Jira: $0 → $7.53 → $13.53
- Atlassian Confluence: $0 → $5.16 → $9.73

#### CRM & Sales Tools ($25-$500/user/mo)
- Salesforce: $25 → $100/$165 → $330/$500

#### Creative Tools ($69.99-$104.99/user/mo)
- Adobe Creative Cloud: $69.99 → $99.99 → $104.99

### 3. Cost Optimization Opportunities

#### High-Impact Areas
1. **Adobe Creative Cloud** - Highest per-user cost ($780-$1,260/year)
2. **Salesforce Enterprise+** - Premium CRM tiers ($1,980-$6,000/year)
3. **Microsoft 365 with Copilot** - AI add-ons ($360/year additional)

#### Common Waste Patterns
1. **Unused Premium Features** - Users on high tiers using only basic functionality
2. **Inactive Licenses** - Paid seats for users who don't log in regularly
3. **Duplicate Tools** - Multiple solutions serving the same purpose
4. **Annual vs Monthly** - 5-20% savings available with annual commitments

### 4. Benchmarking Guidelines

#### Small Teams (1-50 users)
- Communication: $0-$10/user/mo
- Productivity: $6-$15/user/mo
- Project Management: $0-$8/user/mo

#### Medium Organizations (51-500 users)
- Communication: $7-$15/user/mo
- Productivity: $12-$25/user/mo
- CRM: $25-$165/user/mo

#### Enterprise (500+ users)
- Expect 10-25% volume discounts
- Custom pricing for most enterprise tiers
- Additional compliance and security costs

## Usage Notes for IT Cost Analyzer

This data should be used for:
- **Benchmarking** current license costs against market rates
- **Identifying** overpriced or underutilized licenses
- **Calculating** potential savings from tier downgrades
- **Planning** budget forecasts with upcoming price increases
- **Comparing** alternative solutions in the same category

Last updated: July 2025
Data source: Public pricing pages and vendor announcements