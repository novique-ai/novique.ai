import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ThemeShell from '@/components/marketing/ThemeShell';
import ROICalculatorForm from '@/components/roi-calculator/ROICalculatorForm';
import SegmentParamSync from './segment-param-sync';

type SegmentKey = 'financial' | 'healthcare' | 'logistics' | 'real-estate';

const SEGMENT_KEYS: SegmentKey[] = ['financial', 'healthcare', 'logistics', 'real-estate'];

// Prebuild these routes at build time (SSG)
export function generateStaticParams() {
  return SEGMENT_KEYS.map((segment) => ({ segment }));
}

const SEGMENTS: Record<
  SegmentKey,
  {
    label: string;
    h1: string;
    intro1: string;
    intro2: string;
    ctaHint: string;
    microProof: string;
    hiddenCostBullets: string[];
    hiddenCostOutcomes: string[];
    automationCards: { title: string; body: string }[];
    roiBullets: string[];
    payoffLine: string;
    workflows: string[];
    workflowsIntro?: string;
    otherIndustryLinks: { href: string; label: string }[];
  }
> = {
  financial: {
    label: 'Financial & Professional Services',
    h1: 'Financial & Professional Services AI Automation — Calculate Your ROI',
    intro1:
      'Manual processes are quietly draining profitability from financial and professional services firms — including accounting, advisory, consulting, and compliance-driven teams. From client onboarding to regulatory reporting, small inefficiencies stack up into lost hours, higher costs, and increased risk.',
    intro2:
      'Novique helps financial and professional services teams automate high-friction workflows using AI — and this calculator shows you exactly how much ROI that automation can generate for your firm.',
    ctaHint:
      'Enter a few details below to see time saved, cost reduction, and projected annual ROI.',
    microProof:
      'Based on automation projects delivered for SMB financial and professional services teams, including accounting firms, advisory practices, consultancies, and fintech environments.',
    hiddenCostBullets: [
      'Excessive time spent on client intake and document collection',
      'Manual data entry between systems (CRM, accounting, compliance tools)',
      'Repetitive report generation and reconciliation',
      'Compliance tasks handled via spreadsheets and email',
      'Senior staff doing work that should be automated or delegated',
    ],
    hiddenCostOutcomes: [
      'Higher labor costs',
      'Reduced client capacity',
      'Increased error and compliance risk',
    ],
    automationCards: [
      {
        title: 'Automated client onboarding',
        body: 'Forms, document intake, validation, and CRM updates.',
      },
      {
        title: 'AI-assisted document processing',
        body: 'Extracting structured data from PDFs, statements, and invoices.',
      },
      {
        title: 'Workflow-driven compliance checks',
        body: 'Rules-based reviews with audit-ready logs.',
      },
      {
        title: 'Automated reporting',
        body: 'Weekly, monthly, and client-facing reports generated automatically.',
      },
      {
        title: 'Task orchestration',
        body: 'Work routed to the right person at the right time.',
      },
    ],
    roiBullets: [
      '20–40% reduction in time spent on administrative and operational tasks',
      '10–25 hours saved per employee per month',
      'Lower compliance risk through standardized workflows',
      'Faster client onboarding, improving conversion and retention',
    ],
    payoffLine: 'For many teams, automation pays for itself within months — not years.',
    workflows: [
      'Client onboarding and document intake',
      'Data entry between CRM, accounting, and compliance systems',
      'Compliance preparation and audit support workflows',
      'Monthly, quarterly, and client-facing reporting',
      'Internal task routing and approvals',
    ],
    workflowsIntro:
      'They are common across accounting firms, consultancies, advisory practices, compliance teams, and other professional services organizations.',
    otherIndustryLinks: [
      { href: '/roi/healthcare', label: 'Healthcare Workflow Automation ROI' },
      { href: '/roi/logistics', label: 'Logistics Process Automation ROI' },
      { href: '/roi/real-estate', label: 'Real Estate Operations Automation ROI' },
    ],
  },
  healthcare: {
    label: 'Healthcare & Health Services',
    h1: 'Healthcare & Health Services Workflow Automation — Calculate Your ROI',
    intro1:
      'Healthcare and health services teams lose valuable hours every week to manual intake, scheduling coordination, documentation, and follow-ups. These inefficiencies lead to longer wait times, staff burnout, and avoidable administrative cost.',
    intro2:
      'Novique helps healthcare and health services organizations automate high-friction operational workflows using AI — and this calculator shows you exactly how much ROI that automation can generate for your team.',
    ctaHint:
      'Enter a few details below to see time saved, cost reduction, and projected annual ROI.',
    microProof:
      'Based on automation patterns commonly deployed across SMB healthcare environments, including clinics, specialty practices, and health services providers.',
    hiddenCostBullets: [
      'Manual patient intake, forms, and document collection',
      'Scheduling, rescheduling, and reminder coordination handled by staff',
      'Time-consuming routing of charts, referrals, and internal documentation',
      'Follow-ups with patients, payers, or partners handled via phone and email',
      'Staff performing repetitive administrative tasks instead of patient-facing work',
    ],
    hiddenCostOutcomes: [
      'Higher administrative labor costs',
      'Increased no-shows and slower patient throughput',
      'Staff burnout and inconsistent patient experience',
    ],
    automationCards: [
      {
        title: 'Automated patient intake',
        body: 'Digitize forms, collect documents, validate inputs, and route information automatically.',
      },
      {
        title: 'Scheduling and reminders',
        body: 'Automate confirmations, reminders, and rescheduling to reduce no-shows.',
      },
      {
        title: 'Document routing workflows',
        body: 'Automatically route referrals, records, and internal documents to the right queue.',
      },
      {
        title: 'Follow-up automation',
        body: 'Trigger post-visit instructions, check-ins, and task creation based on simple rules.',
      },
      {
        title: 'Operational task orchestration',
        body: 'Ensure staff tasks are created, routed, and tracked consistently across teams.',
      },
    ],
    roiBullets: [
      '15–35% reduction in time spent on administrative coordination',
      'Fewer no-shows through consistent reminders and follow-ups',
      'Faster intake and reduced time-to-appointment',
      'More consistent handoffs and fewer dropped tasks',
    ],
    payoffLine:
      'For many healthcare teams, automation pays for itself by freeing staff time and increasing operational throughput.',
    workflows: [
      'Patient intake, forms, and document capture',
      'Scheduling, reminders, and rescheduling workflows',
      'Referral and internal document routing',
      'Post-visit follow-ups and communications',
      'Internal task routing and approvals',
    ],
    workflowsIntro:
      'They are common across clinics, specialty practices, healthcare service providers, and patient-facing operations where scheduling, documentation, and follow-up drive efficiency and care quality.',
    otherIndustryLinks: [
      { href: '/roi/financial', label: 'Financial Services AI Automation ROI' },
      { href: '/roi/logistics', label: 'Logistics Process Automation ROI' },
      { href: '/roi/real-estate', label: 'Real Estate Operations Automation ROI' },
    ],
  },
  logistics: {
    label: 'Logistics & Transportation',
    h1: 'Logistics & Transportation Process Automation — Calculate Your ROI',
    intro1:
      'In logistics and transportation, small inefficiencies multiply fast — manual status updates, missed handoffs, delayed paperwork, and constant exception chasing. The result is higher overhead, slower throughput, and a tougher customer experience.',
    intro2:
      'Novique helps logistics and transportation teams automate high-friction operational workflows using AI — and this calculator shows you exactly how much ROI that automation can generate for your operation.',
    ctaHint:
      'Enter a few details below to see time saved, cost reduction, and projected annual ROI.',
    microProof:
      'Based on automation patterns commonly deployed across SMB logistics operations, including dispatch coordination, shipment documentation, and customer status workflows.',
    hiddenCostBullets: [
      'Manual shipment status updates, check-calls, and exception handling',
      'Paperwork processing (BOLs, PODs, invoices) done by hand',
      'Dispatch and driver coordination via phone calls, email, and fragmented tools',
      'Customer updates repeated across email threads and ad hoc messages',
      'Billing prep and reconciliation slowed by missing or inconsistent data',
    ],
    hiddenCostOutcomes: [
      'Higher coordination cost per load/shipment',
      'Slower pickup-to-invoice cycle time',
      'More errors, disputes, and rework across teams',
    ],
    automationCards: [
      {
        title: 'Document processing automation',
        body: 'Extract and validate data from BOL/POD/invoices and route it into your systems automatically.',
      },
      {
        title: 'Status and exception workflows',
        body: 'Trigger alerts, tasks, and updates when shipments hit delays, holds, or exceptions.',
      },
      {
        title: 'Customer communication automation',
        body: 'Automate proactive ETAs, status updates, and common request handling via email/SMS.',
      },
      {
        title: 'Dispatch task orchestration',
        body: 'Standardize dispatch steps and route tasks to the right person at the right time.',
      },
      {
        title: 'Billing and reconciliation support',
        body: 'Reduce manual matching, flag anomalies, and improve invoice accuracy before send-out.',
      },
    ],
    roiBullets: [
      '20–45% reduction in time spent on coordination and paperwork',
      'Faster billing cycles by reducing document delays and missing data',
      'Fewer disputes and less rework through standardized workflows',
      'Improved customer experience through consistent proactive updates',
    ],
    payoffLine:
      'For many teams, automation pays back quickly when each shipment requires less manual coordination and follow-up.',
    workflows: [
      'BOL/POD/invoice ingestion and data extraction',
      'Shipment status updates and exception handling',
      'Dispatch coordination and task routing',
      'Customer communications and ETA updates',
      'Billing preparation, reconciliation, and dispute reduction',
    ],
    workflowsIntro:
      'They are common across logistics providers, transportation operators, dispatch teams, and warehouse-coordinated operations where speed, accuracy, and handoffs directly impact margins.',
    otherIndustryLinks: [
      { href: '/roi/financial', label: 'Financial Services AI Automation ROI' },
      { href: '/roi/healthcare', label: 'Healthcare Workflow Automation ROI' },
      { href: '/roi/real-estate', label: 'Real Estate Operations Automation ROI' },
    ],
  },
  'real-estate': {
    label: 'Real Estate & Construction',
    h1: 'Real Estate & Construction Workflow Automation — Calculate Your ROI',
    intro1:
      'Real estate and construction teams lose hours to manual coordination — lead follow-ups, scheduling, vendor communication, change requests, and document handoffs. These gaps create delays, missed opportunities, and avoidable administrative cost.',
    intro2:
      'Novique helps real estate and construction organizations automate high-friction operational workflows using AI — and this calculator shows you exactly how much ROI that automation can generate for your business.',
    ctaHint:
      'Enter a few details below to see time saved, cost reduction, and projected annual ROI.',
    microProof:
      'Based on automation patterns commonly deployed for SMB real estate operators, contractors, and service teams coordinating leads, jobs, vendors, and documents.',
    hiddenCostBullets: [
      'Lead follow-up and qualification handled manually (slow response times)',
      'Scheduling showings, site visits, and job walks via email and phone',
      'Vendor/subcontractor coordination and reminders handled ad hoc',
      'Document sprawl across inboxes (estimates, contracts, change orders, invoices)',
      'Progress updates and approvals that require constant chasing',
    ],
    hiddenCostOutcomes: [
      'Lost deals and slower conversion from delayed lead response',
      'Project delays and cost overruns from missed handoffs',
      'Higher admin overhead per job or project',
    ],
    automationCards: [
      {
        title: 'Lead response and qualification',
        body: 'Automate immediate follow-up, routing, and qualification steps to speed response time.',
      },
      {
        title: 'Scheduling workflows',
        body: 'Automate booking, reminders, confirmations, and rescheduling for visits and walkthroughs.',
      },
      {
        title: 'Vendor and subcontractor tasking',
        body: 'Route tasks, send reminders, and track completion without manual chasing.',
      },
      {
        title: 'Document processing and routing',
        body: 'Standardize estimates/contracts/change orders and route for review and approval.',
      },
      {
        title: 'Project updates and approvals',
        body: 'Automate milestone-based updates, approvals, and client communications tied to project progress.',
      },
    ],
    roiBullets: [
      'Faster lead response and higher conversion through immediate follow-up',
      'Reduced admin time per job through standardized coordination',
      'Fewer delays by automating reminders, handoffs, and approvals',
      'Better client experience through consistent communication',
    ],
    payoffLine:
      'For many teams, automation pays for itself by improving coordination speed and reducing delays that erode margins.',
    workflows: [
      'Lead capture, follow-up, qualification, and routing',
      'Showing/site visit/job walk scheduling and reminders',
      'Estimate/contract/change-order document routing',
      'Vendor/subcontractor coordination and task management',
      'Milestone updates, approvals, and client communications',
    ],
    workflowsIntro:
      'They are common across brokerages, property managers, contractors, and construction service teams coordinating leads, schedules, vendors, documents, and project milestones.',
    otherIndustryLinks: [
      { href: '/roi/financial', label: 'Financial Services AI Automation ROI' },
      { href: '/roi/healthcare', label: 'Healthcare Workflow Automation ROI' },
      { href: '/roi/logistics', label: 'Logistics Process Automation ROI' },
    ],
  },
};

function isSegmentKey(value: string): value is SegmentKey {
  return value in SEGMENTS;
}

interface PageProps {
  params: Promise<{ segment: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segment } = await params;
  if (!isSegmentKey(segment)) return {};
  const s = SEGMENTS[segment];
  return {
    title: `${s.h1} | Novique.ai`,
    description: `${s.intro1} ${s.ctaHint}`.slice(0, 160),
    alternates: { canonical: `/roi/${segment}` },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${s.h1} | Novique.ai`,
      description: s.ctaHint,
      url: `/roi/${segment}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${s.h1} | Novique.ai`,
      description: s.ctaHint,
    },
  };
}

export default async function SegmentROILandingPage({ params }: PageProps) {
  const { segment } = await params;
  if (!isSegmentKey(segment)) notFound();
  const s = SEGMENTS[segment];

  return (
    <ThemeShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-12 pt-24 md:pt-32">
        {/* Client-side URL param sync for existing calculator behavior */}
        <Suspense fallback={null}>
          <SegmentParamSync segment={segment} />
        </Suspense>

        <header className="text-center">
          <p className="nv-eyebrow mb-4">{s.label}</p>
          <h1 className="font-display text-display tracking-tight text-ink-0 text-balance md:text-display-xl">
            {s.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-body-lg leading-relaxed text-ink-2">
            {s.intro1}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-body-lg leading-relaxed text-ink-2">
            {s.intro2}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm italic text-ink-3">
            {s.microProof}
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-sm font-medium text-aqua">
            {s.ctaHint}
          </p>
        </header>

        <section className="mt-16">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            The Hidden Cost of Manual Work in {s.label}
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            {s.label} teams don&apos;t usually think they&apos;re inefficient — but the numbers
            tell a different story. Common pain points we see across teams:
          </p>

          <ul className="mt-6 space-y-2 text-sm leading-6">
            {s.hiddenCostBullets.map((b) => (
              <li key={b} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                <span className="text-ink-1">{b}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-6 text-ink-2">
            These aren&apos;t just operational annoyances — they translate directly into:
          </p>

          <ul className="mt-4 space-y-2 text-sm leading-6">
            {s.hiddenCostOutcomes.map((o) => (
              <li key={o} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-warning" aria-hidden="true" />
                <span className="text-ink-1">{o}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            What AI Workflow Automation Looks Like in {s.label}
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            This isn&apos;t about replacing people — it&apos;s about removing low-value work.
            Examples of automation Novique deploys for {s.label.toLowerCase()} teams:
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {s.automationCards.map((c) => (
              <div key={c.title} className="nv-card p-5">
                <h3 className="font-display text-dh3 text-ink-0">{c.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">{c.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm font-medium text-aqua">
            The result is fewer handoffs, fewer errors, and significantly more billable or
            advisory time.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            Real ROI Examples for {s.label} Teams
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            Based on real-world deployments, {s.label.toLowerCase()} firms typically see:
          </p>

          <div className="mt-6 nv-card p-6">
            <ul className="space-y-3 text-sm leading-6">
              {s.roiBullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stroke-accent text-aqua">
                    ✓
                  </span>
                  <span className="text-ink-1">{b}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-center text-sm font-semibold text-aqua">
              {s.payoffLine}
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            Common {s.label} Workflows We Automate
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            These workflows are typically high-volume, repetitive, and time-sensitive — making
            them ideal candidates for ROI-positive automation.
            {s.workflowsIntro && <> {s.workflowsIntro}</>}
          </p>

          <ul className="mt-6 grid gap-2 text-sm leading-6 md:grid-cols-2">
            {s.workflows.map((w) => (
              <li key={w} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                <span className="text-ink-1">{w}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            Explore Automation ROI in Other Industries
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            If you&apos;re evaluating automation across multiple parts of your business, it can
            help to compare ROI across industries:
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {s.otherIndustryLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between rounded-xl border border-stroke-1 bg-surface-2 px-5 py-4 transition-all hover:border-stroke-accent hover:bg-surface-3"
              >
                <span className="text-sm font-medium text-ink-1 group-hover:text-ink-0">
                  {l.label}
                </span>
                <svg
                  className="h-5 w-5 text-ink-3 transition-transform group-hover:translate-x-1 group-hover:text-aqua"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            Calculate Your ROI
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            Now let&apos;s make this specific to your firm. Use the calculator below to estimate
            time saved, annual labor cost reduction, and net ROI based on your team size and
            workload.
          </p>

          <div className="mt-8 rounded-2xl border border-stroke-1 bg-surface-1 p-6">
            <Suspense
              fallback={
                <div className="h-96 animate-pulse rounded-xl border border-stroke-1 bg-surface-2" />
              }
            >
              <ROICalculatorForm />
            </Suspense>
          </div>
        </section>

        <section className="mt-16 text-center">
          <h2 className="font-display text-dh2 tracking-tight text-ink-0">
            Ready to See the Numbers?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-ink-2">
            If you&apos;re wondering whether automation makes sense for your team, don&apos;t
            guess. Run the ROI calculator above and see what AI-driven workflow automation could
            return to your business this year.
          </p>
        </section>
      </div>
    </ThemeShell>
  );
}
