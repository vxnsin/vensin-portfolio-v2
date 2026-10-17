"use client";

import Link from "next/link";
import { useState } from "react";
import type { FolderIcon } from "@/lib/gallery-icons";
import { TreeGlyph } from "./FolderGlyph";

// The folder tree on the left, like an old file explorer: dotted guide lines, [+]/[-] boxes, counts.
// Folders on the path to the open one start expanded; the rest can be opened by hand.

export type TreeNode = { id: string; name: string; icon: FolderIcon; href: string; count: number; exclusive: boolean; unlisted: boolean; children: TreeNode[] };

function Row({ node, currentId, openIds, depth }: { node: TreeNode; currentId: string | null; openIds: Set<string>; depth: number }) {
  // follows the open folder until the visitor clicks the box, then their choice wins
  const [manual, setManual] = useState<boolean | null>(null);
  const expanded = manual ?? (openIds.has(node.id) || depth === 0);
  const setExpanded = (f: (e: boolean) => boolean) => setManual(f(expanded));
  const active = node.id === currentId;
  const hasKids = node.children.length > 0;
  return (
    <li className="tree-item">
      <div className="flex items-center gap-1 min-w-0">
        {hasKids ? (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="tree-toggle" aria-label={expanded ? `collapse ${node.name}` : `expand ${node.name}`} aria-expanded={expanded}>
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="tree-toggle tree-toggle-empty" aria-hidden />
        )}
        <Link href={node.href} className={`tree-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} scroll={false}>
          <TreeGlyph icon={node.icon} open={active || (expanded && hasKids)} />
          <span className="truncate">{node.name}</span>
          <span className="tree-count">{node.count}</span>
          {node.exclusive && !node.unlisted && (
            <span className="tree-flag" title="photos in here only show up inside this folder">
              ◆
            </span>
          )}
          {node.unlisted && (
            <span className="tree-flag" title="unlisted: only people with the link see this folder">
              ◇
            </span>
          )}
        </Link>
      </div>
      {hasKids && expanded && (
        <ul className="tree-list">
          {node.children.map((c) => (
            <Row key={c.id} node={c} currentId={currentId} openIds={openIds} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FolderTree({ roots, currentId, openIds, total }: { roots: TreeNode[]; currentId: string | null; openIds: string[]; total: number }) {
  const open = new Set(openIds);
  return (
    <nav aria-label="gallery folders" className="text-[11px]">
      <Link href="/gallery" className={`tree-link tree-root ${currentId === null ? "is-active" : ""}`} aria-current={currentId === null ? "page" : undefined} scroll={false}>
        <TreeGlyph icon="folder" open={currentId === null} />
        <span className="truncate">all</span>
        <span className="tree-count">{total}</span>
      </Link>
      {roots.length > 0 && (
        <ul className="tree-list tree-top">
          {roots.map((n) => (
            <Row key={n.id} node={n} currentId={currentId} openIds={open} depth={0} />
          ))}
        </ul>
      )}
    </nav>
  );
}
