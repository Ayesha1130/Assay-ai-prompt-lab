import type { TestCase, Variant } from "./engine/types.ts";

export interface Preset {
  id: string;
  title: string;
  blurb: string;
  a: Variant;
  b: Variant;
  cases: TestCase[];
}

const MODEL = "demo-sim";

export const PRESETS: Preset[] = [
  {
    id: "triage",
    title: "Support ticket triage",
    blurb: "Sort tickets into one label. Exact match.",
    a: { name: "Short prompt", model: MODEL, template: "Classify this ticket: {{input}}" },
    b: {
      name: "Strict prompt",
      model: MODEL,
      template:
        "You are a support triage assistant. Classify the ticket into exactly one of: billing, bug, feature, account. Answer with only the label.\n\nTicket: {{input}}",
    },
    cases: [
      { id: "t1", input: "I was charged twice for my March invoice.", expected: "billing", scorer: "exact" },
      { id: "t2", input: "The export button does nothing when I click it.", expected: "bug", scorer: "exact" },
      { id: "t3", input: "Could you add a dark mode to the dashboard?", expected: "feature", scorer: "exact" },
      { id: "t4", input: "I can't sign in after changing my email address.", expected: "account", scorer: "exact" },
      { id: "t5", input: "Please send me a refund for last month.", expected: "billing", scorer: "exact" },
      { id: "t6", input: "The app crashes whenever I open settings.", expected: "bug", scorer: "exact" },
      { id: "t7", input: "It would help to have a CSV import option.", expected: "feature", scorer: "exact" },
      { id: "t8", input: "How do I delete my account and data?", expected: "account", scorer: "exact" },
    ],
  },
  {
    id: "contact-json",
    title: "Contact details as JSON",
    blurb: "Pull a name and email out of messy text. Valid JSON with the right keys.",
    a: { name: "Plain ask", model: MODEL, template: "Extract the name and email from: {{input}}" },
    b: {
      name: "Schema ask",
      model: MODEL,
      template:
        "You are a data extraction tool. Read the message and return only a JSON object with the keys name and email. No other text.\n\nMessage: {{input}}",
    },
    cases: [
      { id: "j1", input: "Hi, it's Sara Khan, reach me at sara@example.com", expected: "name, email", scorer: "json" },
      { id: "j2", input: "Contact: Omar Ali <omar.ali@example.org>", expected: "name, email", scorer: "json" },
      { id: "j3", input: "Regards, Lina (lina@example.net)", expected: "name, email", scorer: "json" },
      { id: "j4", input: "From Bilal Ahmed - bilal@example.com - Karachi", expected: "name, email", scorer: "json" },
      { id: "j5", input: "My name is Noor and my email is noor@example.io", expected: "name, email", scorer: "json" },
      { id: "j6", input: "Ping Hamza at hamza@example.dev when it ships", expected: "name, email", scorer: "json" },
    ],
  },
  {
    id: "summary",
    title: "One-line summaries",
    blurb: "Keep summaries under 20 words. Word limit.",
    a: { name: "Open ended", model: MODEL, template: "Summarize this text: {{input}}" },
    b: {
      name: "Length capped",
      model: MODEL,
      template:
        "Summarize the text below in exactly one sentence of at most 20 words. Return only the summary.\n\n{{input}}",
    },
    cases: [
      {
        id: "s1",
        input: "The city council voted on Tuesday to extend the bus network to the east side, adding six routes by spring.",
        expected: "20",
        scorer: "maxWords",
      },
      {
        id: "s2",
        input: "Researchers found that short daily walks improved sleep quality in a six month study of 400 adults.",
        expected: "20",
        scorer: "maxWords",
      },
      {
        id: "s3",
        input: "The company moved its launch to June after testers reported battery problems in the first batch of devices.",
        expected: "20",
        scorer: "maxWords",
      },
      {
        id: "s4",
        input: "Heavy rain closed two highways overnight, and crews expect to reopen both by midday if the water recedes.",
        expected: "20",
        scorer: "maxWords",
      },
      {
        id: "s5",
        input: "A local bakery began selling day-old bread at half price, cutting waste and bringing in new customers.",
        expected: "20",
        scorer: "maxWords",
      },
    ],
  },
];

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
