"use client";

export function SiteNav() {
	return (
		<header className="sticky top-0 z-50">
			<div className="nav-frost" aria-hidden="true">
				<span className="nav-frost__band nav-frost__band--1" />
				<span className="nav-frost__band nav-frost__band--2" />
				<span className="nav-frost__band nav-frost__band--3" />
				<span className="nav-frost__band nav-frost__band--4" />
			</div>
			<nav className="relative z-10 mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
				<a href="/" className="flex items-center gap-2.5 group">
					<span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-amber-300 to-orange-500 text-black shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
						<svg
							viewBox="0 0 24 24"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth={2.2}
							strokeLinecap="round"
							strokeLinejoin="round"
							role="img"
						>
							<title>Vibration</title>
							<rect x="9" y="2" width="6" height="20" rx="3" />
							<path d="M4 9v6M20 9v6" />
						</svg>
					</span>
					<span className="font-mono text-sm font-semibold tracking-tight text-white">
						ios-vibrator-pro-max
					</span>
				</a>

				<div className="flex items-center gap-1 text-sm text-white/60">
					<a
						href="https://www.npmjs.com/package/ios-vibrator-pro-max"
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5 hover:text-white"
					>
						<svg
							viewBox="0 0 27.23 27.23"
							className="size-4"
							fill="currentColor"
							role="img"
						>
							<title>npm</title>
							<path d="M0 0v27.23h27.23V0zm21.78 21.78h-2.72v-13.6h-5.45v13.6H5.45V5.45h16.33z" />
						</svg>
						npm
					</a>
					<a
						href="https://github.com/samdenty/ios-vibrator-pro-max"
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
					>
						<svg
							viewBox="0 0 24 24"
							className="size-4"
							fill="currentColor"
							role="img"
						>
							<title>GitHub</title>
							<path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.58 0-.29-.01-1.04-.02-2.05-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.21.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.23-3.15-.12-.3-.53-1.51.12-3.15 0 0 1-.32 3.3 1.2a11.6 11.6 0 0 1 6 0c2.28-1.52 3.29-1.2 3.29-1.2.65 1.64.24 2.85.12 3.15.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
						</svg>
						GitHub
					</a>
				</div>
			</nav>
		</header>
	);
}
