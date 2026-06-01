export interface Suggestion {
  icon: 'Code' | 'Brain' | 'Sparkles' | 'MessageSquare';
  title: string;
  description: string;
  query: string;
}

export const SUGGESTIONS: Suggestion[] = [
  {
    icon: 'Code',
    title: 'Write a clean API',
    description: 'Implement a modern Next.js route handler with validation',
    query: 'Write a modern, production-ready Next.js API Route Handler in TypeScript that validates incoming JSON payloads, handles runtime errors, and returns robust structured responses.'
  },
  {
    icon: 'Brain',
    title: 'Explain System Design',
    description: 'Deconstruct Microservices vs Monolith architectures',
    query: 'Explain the fundamental differences between Monolithic and Microservice system designs. What are the key trade-offs in scaling, network latency, and deployment complexity?'
  },
  {
    icon: 'Sparkles',
    title: 'Futuristic Sci-Fi Concept',
    description: 'Draft a short creative outline for a coding AI sentient core',
    query: 'Write a compelling sci-fi scenario about an advanced agentic AI interface called Aeva, which discovers an anomaly in its deep neural weights.'
  },
  {
    icon: 'MessageSquare',
    title: 'Optimize React Components',
    description: 'Guidelines on custom state hook performance',
    query: 'How do I optimize rendering performance in complex React forms? Show me patterns using debounced callbacks and state isolation strategies.'
  }
];
