import { useCurrentUser } from '@/hooks/auth';
import useLocalStorage from '@/hooks/localStorage';
import { getTerms } from '@/utils/browseTerms';
import { chooseYourPlayer } from '@/utils/chooseYourPlayer';
import { genericToastOptions } from '@/utils/toastOptions';
import { withAuth } from '@/utils/withAuth';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
function IndexPage() {
	const router = useRouter();
	const { rdUser, adUser, rdError, adError, traktUser, traktError } = useCurrentUser();
	const [traktToken] = useLocalStorage<string>('trakt:accessToken');
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (rdError) {
			toast.error(
				'Real-Debrid get user info failed, check your email and confirm the login coming from DMM'
			);
		}
		if (adError) {
			toast.error(
				'AllDebrid get user info failed, check your email and confirm the login coming from DMM'
			);
		}
		if (traktError) {
			toast.error('Trakt get user info failed');
		}
	}, [rdError, adError, traktError]);

	const handleLogout = (prefix?: string) => {
		if (prefix) {
			let i = localStorage.length - 1;
			while (i >= 0) {
				const key = localStorage.key(i);
				if (key && key.startsWith(prefix)) localStorage.removeItem(key);
				i--;
			}

			router.reload();
		} else {
			localStorage.clear();
			router.push('/start');
		}
	};

	const allowMagnetHandling = (): boolean => {
		const userAgent = navigator.userAgent;
		const isMobile = /Mobi|Android/i.test(userAgent);

		// Add conditions for supported browsers
		const isChrome = /Chrome/.test(userAgent) && !isMobile;
		const isEdge = /Edg/.test(userAgent) && !isMobile;
		const isFirefox = /Firefox/.test(userAgent);
		const isOpera = /OPR/.test(userAgent) && !isMobile;

		return isChrome || isEdge || isFirefox || isOpera;
	};

	const handleTraktLogin = async () => {
		// generate authorization url
		const authUrl = `/api/trakt/auth?redirect=${window.location.origin}`;
		router.push(authUrl);
	};

	const handleDefaultClient = async () => {
		try {
			navigator.registerProtocolHandler(
				'magnet',
				`${window.location.origin}/library?addMagnet=%s`
			);
		} catch (err: unknown) {
			toast.error('Your browser does not support this feature.', genericToastOptions);
		}
	};

	const handleClearCache = async () => {
		setDeleting(true);
		const request = window.indexedDB.deleteDatabase('DMMDB');
		request.onsuccess = function () {
			window.location.assign('/library');
		};
		request.onerror = function () {
			setDeleting(false);
			toast.error('Database deletion failed', genericToastOptions);
		};
		request.onblocked = function () {
			setDeleting(false);
			toast(
				'Database is still open, refresh the page first and then try deleting again',
				genericToastOptions
			);
		};
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<Head>
				<title>Debrid Media Manager - Home</title>
			</Head>
			<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 200 200">
				<rect x="25" y="25" width="150" height="150" fill="#2C3E50" rx="20" ry="20" />
				<circle cx="100" cy="100" r="60" fill="#00A0B0" />
				<path d="M85,65 L85,135 L135,100 Z" fill="#ECF0F1" />
				<path d="M60,90 Q80,60 100,90 T140,90" fill="#CC333F" />
				<path
					d="M75,121 L80,151 L90,136 L100,151 L110,136 L120,151 L125,121 Z"
					fill="#EDC951"
				/>
			</svg>
			<Toaster position="bottom-right" />
			{/* this is made by ChatGPT */}
			{!deleting && (rdUser || adUser) ? (
				<>
					<h1 className="text-2xl font-bold mb-4">Debrid Media Manager</h1>
					<div className="flex flex-col items-center">
						<div className="text-md font-bold mb-4 w-screen text-center">
							Welcome back,{' '}
							{rdUser ? (
								<>
									Real-Debrid: {rdUser.username} {rdUser.premium ? '✅' : '❌'}
								</>
							) : (
								<Link
									href="/realdebrid/login"
									className="px-1 py-1 ml-2 text-xs text-white bg-gray-500 rounded hover:bg-gray-600 whitespace-nowrap"
								>
									Login with Real-Debrid
								</Link>
							)}{' '}
							{adUser ? (
								<>
									AllDebrid: {adUser.username} {adUser.isPremium ? '✅' : '❌'}
								</>
							) : (
								<Link
									href="/alldebrid/login"
									className="px-1 py-1 ml-2 text-xs text-white bg-gray-500 rounded hover:bg-gray-600 whitespace-nowrap"
								>
									Login with AllDebrid
								</Link>
							)}{' '}
							{traktToken ? (
								<>
									Trakt: <span className="text-green-500">✅</span>
								</>
							) : (
								<button
									onClick={() => handleTraktLogin()}
									className="px-1 py-1 ml-2 text-xs text-white bg-red-500 rounded hover:bg-red-600 whitespace-nowrap"
								>
									Login with Trakt
								</button>
							)}
						</div>

						<div className="mb-2 h-max text-center leading-10">
							<Link
								href="/library"
								className="text-md m-1 bg-cyan-800 hover:bg-cyan-700 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								📚 Library
							</Link>

							<Link
								href="https://hashlists.debridmediamanager.com"
								target="_blank"
								className="text-md m-1 bg-cyan-800 hover:bg-cyan-700 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								#️⃣ Hash lists
							</Link>

							<Link
								href="/search"
								className="text-md m-1 bg-blue-800 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								🔎 Search
							</Link>

							{rdUser && (
								<Link
									href="/stremio"
									className="text-md m-1 bg-purple-800 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
								>
									🔮 Stremio
								</Link>
							)}
						</div>

						<div className="mb-2 h-max text-center leading-10">
							<Link
								href="/browse"
								className="text-sm m-1 bg-blue-600 hover:bg-blue-400 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								🏆 top
							</Link>

							<Link
								href="/browse/recent"
								className="text-sm m-1 bg-blue-600 hover:bg-blue-400 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								⏰ recent
							</Link>

							{getTerms(2).map((term) => (
								<Link
									href={`/browse/${term.replace(/\W/gi, '')}`}
									className="text-sm m-1 bg-neutral-600 hover:bg-neutral-400 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
									key={term}
								>
									{term}
								</Link>
							))}

							<Link
								href={`/trakt/movies`}
								className="text-sm m-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								🎥 movies
							</Link>
							<Link
								href={`/trakt/shows`}
								className="text-sm m-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								📺 shows
							</Link>
							<Link
								href={`/trakt/mylists`}
								className="text-sm m-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded whitespace-nowrap"
							>
								🧏🏻‍♀️ my lists
							</Link>
						</div>

						<div className="mb-2 h-max text-center leading-10">
							{allowMagnetHandling() && (
								<button
									className="mx-1 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs"
									onClick={() => handleDefaultClient()}
								>
									🧲 Set as default client
								</button>
							)}
							<button
								className="mx-1 bg-sky-500 hover:bg-sky-700 text-white font-bold py-1 px-2 rounded text-xs"
								onClick={() => chooseYourPlayer()}
							>
								👀 Choose your player
							</button>
							<button
								className="mx-1 bg-orange-500 hover:bg-orange-700 text-white font-bold py-1 px-2 rounded text-xs"
								onClick={() => handleClearCache()}
							>
								💦 Clear library cache
							</button>
						</div>

						<div className="text-sm mb-1 text-center">
							✨
							<a
								className="underline"
								href="https://github.com/debridmediamanager/zurg-testing"
								target="_blank"
							>
								<b>zurg</b>
							</a>{' '}
							mounts your Real-Debrid library and play your files directly from your
							computer or with Plex
						</div>
						<div className="text-sm mb-1 text-center">
							Browser extensions for{' '}
							<b>
								<a
									className="underline"
									href="https://chromewebstore.google.com/detail/debrid-media-manager/fahmnboccjgkbeeianfdiohbbgmgoibb"
									target="_blank"
								>
									Chrome
								</a>
							</b>{' '}
							and{' '}
							<b>
								<a
									className="underline"
									href="https://addons.mozilla.org/en-US/firefox/addon/debrid-media-manager/"
									target="_blank"
								>
									Firefox
								</a>
							</b>
							<span className="px-1">✨</span>
							<a className="underline" href="https://zurg.club" target="_blank">
								<b>zurg.club</b>
							</a>{' '}
							is a an optimized Plex+zurg server hosting
						</div>
						<div className="text-sm mb-1 text-center">
							✨
							<a
								className="text-azure bg-red-500 text-red-100 px-1"
								href="https://www.reddit.com/r/debridmediamanager/"
								target="_blank"
							>
								r/debridmediamanager
							</a>{' '}
							🤝 Sponsor this project&apos;s development on{' '}
							<a
								className="underline"
								href="https://github.com/sponsors/debridmediamanager"
								target="_blank"
							>
								Github
							</a>{' '}
							|{' '}
							<a
								className="underline"
								href="https://www.patreon.com/debridmediamanager"
								target="_blank"
							>
								Patreon
							</a>{' '}
							|{' '}
							<a
								className="underline"
								href="https://paypal.me/yowmamasita"
								target="_blank"
							>
								Paypal
							</a>
						</div>

						<div className="mb-2 h-max text-center leading-10">
							{rdUser && (
								<button
									className="mx-1 bg-black hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
									onClick={() => handleLogout('rd:')}
								>
									Logout Real-Debrid
								</button>
							)}
							{adUser && (
								<button
									className="mx-1 bg-black hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
									onClick={() => handleLogout('ad:')}
								>
									Logout AllDebrid
								</button>
							)}
							{traktUser && (
								<button
									className="mx-1 bg-black hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
									onClick={() => handleLogout('trakt:')}
								>
									Logout Trakt
								</button>
							)}
							{(rdUser || adUser || traktUser) && (
								<button
									className="mx-1 bg-black hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
									onClick={() => handleLogout()}
								>
									Logout All
								</button>
							)}
						</div>
					</div>
				</>
			) : (
				<h1 className="text-xl text-center">Debrid Media Manager is loading...</h1>
			)}
		</div>
	);
}

export default withAuth(IndexPage);
