"use client";

import ShikiHighlighter from "react-shiki";

import { cn } from "@/lib/utils";

export type CodeBlockProps = {
	code: string;
	language?: string;
	/** Optional filename shown in the window title bar. */
	filename?: string;
	/** Wrap long lines instead of horizontally scrolling. */
	wrap?: boolean;
	className?: string;
};

export function CodeBlock({
	code,
	language = "tsx",
	filename,
	wrap = false,
	className,
}: CodeBlockProps) {
	return (
		<div
			className={cn(
				"group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0d]/80 shadow-2xl shadow-black/40 backdrop-blur-sm",
				className,
			)}
		>
			<div className="flex items-center gap-2 border-b border-white/5 bg-white/2 px-4 py-3">
				<span className="size-3 rounded-full bg-[#ff5f57]" />
				<span className="size-3 rounded-full bg-[#febc2e]" />
				<span className="size-3 rounded-full bg-[#28c840]" />
				{filename ? (
					<span className="ml-2 font-mono text-xs text-white/40">
						{filename}
					</span>
				) : null}
			</div>
			<ShikiHighlighter
				language={language}
				theme="github-dark-default"
				showLanguage={false}
				addDefaultStyles={false}
				className={cn(
					"px-5 py-4 font-mono text-sm leading-relaxed [&_pre]:bg-transparent! [&_pre]:m-0! [&_code]:bg-transparent!",
					wrap
						? "[&_pre]:whitespace-pre-wrap [&_pre]:wrap-break-word [&_code]:whitespace-pre-wrap"
						: "overflow-x-auto",
				)}
			>
				{code.trim()}
			</ShikiHighlighter>
		</div>
	);
}
