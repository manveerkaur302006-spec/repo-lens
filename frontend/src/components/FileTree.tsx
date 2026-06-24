import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from 'lucide-react';
import { FileTreeNode } from '../types';

interface FileTreeProps {
  data: FileTreeNode;
}

function TreeNode({ node, depth = 0 }: { node: FileTreeNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth < 1); // Auto-expand first level
  const isDir = node.type === 'directory';
  const childCount = node.children?.length || 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-all text-sm font-mono
          ${isDir ? 'hover:bg-primary/10 text-textPrimary' : 'hover:bg-white/5 text-textSecondary'}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        {isDir ? (
          <>
            {isOpen ? (
              <ChevronDown size={14} className="text-textSecondary shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-textSecondary shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen size={14} className="text-primary shrink-0" />
            ) : (
              <Folder size={14} className="text-primary/70 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-[14px] shrink-0" />
            <FileCode size={14} className="text-textSecondary/60 shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {isDir && childCount > 0 && (
          <span className="ml-auto text-[10px] text-textSecondary/50 tabular-nums shrink-0">
            {childCount}
          </span>
        )}
      </div>

      {isOpen && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              // Directories first, then alphabetical
              if (a.type === 'directory' && b.type !== 'directory') return -1;
              if (a.type !== 'directory' && b.type === 'directory') return 1;
              return a.name.localeCompare(b.name);
            })
            .map((child, idx) => (
              <TreeNode key={`${child.name}-${idx}`} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ data }: FileTreeProps) {
  return (
    <div className="flex flex-col gap-1">
      <TreeNode node={data} depth={0} />
    </div>
  );
}
