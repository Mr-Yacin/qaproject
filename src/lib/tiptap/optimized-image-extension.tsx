import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import NextImage from 'next/image';
import { useState } from 'react';

/**
 * Custom Tiptap Image extension using Next.js Image component
 * Provides automatic image optimization and lazy loading
 * Requirements: 10.1, 10.5
 */

// React component for the image node view
const OptimizedImageComponent = ({ node }: any) => {
  const [error, setError] = useState(false);
  const { src, alt, title } = node.attrs;

  if (error) {
    return (
      <NodeViewWrapper className="optimized-image-wrapper">
        <div className="bg-gray-200 rounded-lg p-8 text-center">
          <span className="text-gray-500">Image not available</span>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="optimized-image-wrapper">
      <div className="relative w-full" style={{ minHeight: '200px' }}>
        <NextImage
          src={src}
          alt={alt || ''}
          title={title}
          fill
          className="rounded-lg object-contain"
          onError={() => setError(true)}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const OptimizedImage = Node.create({
  name: 'optimizedImage',

  group: 'block',

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(OptimizedImageComponent);
  },
});
