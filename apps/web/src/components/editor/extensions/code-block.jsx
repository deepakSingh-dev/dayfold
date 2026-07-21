'use client';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

const LANGUAGES = [
  'plaintext',
  'bash',
  'c',
  'cpp',
  'css',
  'go',
  'html',
  'java',
  'javascript',
  'json',
  'markdown',
  'python',
  'rust',
  'sql',
  'typescript',
  'yaml',
];

function CodeBlockView({ node, updateAttributes, editor }) {
  const language = node.attrs.language || 'plaintext';
  return (
    <NodeViewWrapper className="df-codeblock" data-type="codeblock">
      <select
        contentEditable={false}
        className="df-code-lang"
        value={language}
        disabled={!editor.isEditable}
        onChange={(e) => updateAttributes({ language: e.target.value })}
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

/** CodeBlockLowlight with a React NodeView that adds a language dropdown. */
export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
