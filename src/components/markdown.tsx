import type { Components } from 'react-markdown'

/** 
 * Shared ReactMarkdown component configuration to be used across 
 * chat messages, summaries, and other markdown content
 */
export const markdownComponents: Components = {
  // Heading
  h1: ({node, ...props}) => (
    <h1 className="text-2xl font-bold text-white mb-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-white mb-3 mt-6" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-semibold text-white mb-2 mt-4" {...props} />
  ),

  // Paragraphs and text
  p: ({ node, ...props }) => (
    <p className="text-gray-200 mb-3 leading-relaxed" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-bold text-white" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="italic text-gray-300" {...props} />
  ),

  // Lists
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="text-gray-200 ml-4" {...props} />
  ),

  // Code
  code: ({ node, ...props }) => (
    <code className="bg-gray-800 px-2 py-1 rounded text-blue-300 text-sm" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre className="bg-gray-800 p-3 rounded my-2 overflow-x-auto" {...props} />
  ),
  
  // Blockquotes
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-3" {...props} />
  ),
  
  // Tables
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-2 border-gray-500" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-gray-600" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="border-b-2 border-gray-500" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="border-2 border-gray-500 px-4 py-2 text-left font-semibold text-white bg-gray-700" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-2 border-gray-500 px-4 py-2 text-gray-200" {...props} />
  ),
}

// Compact version for smaller spaces
export const markdownComponentsCompact: Components = {
  ...markdownComponents,
  h1: ({ node, ...props }) => (
    <h1 className="text-xl font-bold text-white mb-3" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-lg font-bold text-white mb-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-base font-semibold text-white mb-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="text-gray-100 mb-2 leading-relaxed" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-inside text-gray-100 mb-2 space-y-1 ml-2" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside text-gray-100 mb-2 space-y-1 ml-2" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="text-gray-100" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-2 border-gray-500 text-sm" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border-2 border-gray-500 px-3 py-2 text-left font-semibold text-white bg-gray-700" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-2 border-gray-500 px-3 py-2 text-gray-100" {...props} />
  ),
}
