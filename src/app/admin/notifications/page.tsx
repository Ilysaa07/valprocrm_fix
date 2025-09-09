"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	Bell,
	BellRing,
	Check,
	RefreshCcw,
	Star,
	Search,
	Filter,
	Bookmark,
	Clock,
	Info,
	AlertTriangle,
	CheckCircle,
	Trash2,
} from "lucide-react"

type NotificationType = "info" | "success" | "warning" | "error"

interface NotificationItem {
	id: string
	title: string
	message: string
	isRead: boolean
	important?: boolean
	type?: NotificationType
	createdAt: string
	actionUrl?: string
}

export default function Page() {
	const [notifications, setNotifications] = useState<NotificationItem[]>([])
	const [loading, setLoading] = useState(false)
	const [isRefreshing, startRefresh] = useTransition()
	const [activeTab, setActiveTab] = useState<"all" | "unread" | "important">(
		"all",
	)
	const [query, setQuery] = useState("")
	const [unreadCount, setUnreadCount] = useState(0)

	const filtered = useMemo(() => {
		let list = notifications
		if (activeTab === "unread") list = list.filter((n) => !n.isRead)
		if (activeTab === "important") list = list.filter((n) => n.important)
		if (query.trim()) {
			const q = query.toLowerCase()
			list = list.filter(
				(n) =>
					n.title.toLowerCase().includes(q) ||
					n.message.toLowerCase().includes(q),
			)
		}
		return list
	}, [notifications, activeTab, query])

	const importantCount = useMemo(
		() => notifications.filter((n) => n.important).length,
		[notifications],
	)

	async function markAsRead(id: string) {
		try {
			await fetch("/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "mark_read", notificationIds: [id] }),
			})
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
			if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:updated'))
		} catch {}
	}

	async function deleteNotification(id: string) {
		try {
			await fetch("/api/notifications", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notificationIds: [id] }),
			})
			setNotifications((prev) => prev.filter((n) => n.id !== id))
			if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:updated'))
		} catch {}
	}

	async function deleteAllNotifications() {
		try {
			await fetch("/api/notifications?all=true", { method: "DELETE" })
			setNotifications([])
			setUnreadCount(0)
			if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:updated'))
		} catch {}
	}

	async function fetchCounts() {
		try {
			const res = await fetch("/api/notifications/count", { cache: "no-store" })
			if (res.ok) {
				const data = await res.json()
				setUnreadCount(
					(data && typeof data.count === "number") ? data.count : (data?.unread ?? 0)
				)
			}
		} catch {}
	}

	async function fetchNotifications() {
		setLoading(true)
		try {
			const res = await fetch("/api/notifications", { cache: "no-store" })
			if (res.ok) {
				const raw = await res.json()
				const list: unknown = Array.isArray(raw) ? raw : (raw?.notifications ?? raw)
				const arr = Array.isArray(list) ? (list as NotificationItem[]) : []
				setNotifications(
					arr.slice().sort(
						(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
					),
				)
				if (typeof raw?.unreadCount === "number") {
					setUnreadCount(raw.unreadCount)
				}
			}
		} finally {
			setLoading(false)
			fetchCounts()
		}
	}

	useEffect(() => {
		fetchNotifications()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	function iconByType(type?: NotificationType) {
		switch (type) {
			case "success":
				return <CheckCircle className="h-4 w-4 text-green-500" />
			case "warning":
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />
			case "error":
				return <AlertTriangle className="h-4 w-4 text-red-500" />
			default:
				return <Info className="h-4 w-4 text-blue-500" />
		}
	}

	async function markAllAsRead() {
		// Optimistic UI
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
		setUnreadCount(0)
		try {
			await fetch("/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "mark_all_read" }),
			})
		} finally {
			fetchCounts()
			// Notify dropdown to refresh
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new Event('notifications:updated'))
			}
		}
	}

	async function toggleImportant(id: string, important: boolean) {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, important: !important } : n)),
		)
		// Hanya update lokal; endpoint untuk toggle penting belum tersedia.
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event('notifications:updated'))
		}
	}

	return (
		<AdminLayout>
			<div className="max-w-7xl mx-auto p-6 space-y-8">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex items-center space-x-3">
						<div className="relative">
							<Bell className="h-12 w-12 text-accent" />
							{unreadCount > 0 && (
								<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
									{unreadCount}
								</span>
							)}
						</div>

						<div>
							<h1 className="text-4xl font-bold text-text-primary">Notifikasi</h1>
							<p className="text-lg text-text-secondary">
								Kelola dan monitor semua notifikasi sistem
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center space-x-2">
							<div className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
								<BellRing className="h-4 w-4" />
								<span className="text-sm font-medium">{unreadCount}</span>
							</div>
							<div className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
								<Star className="h-4 w-4" />
								<span className="text-sm font-medium">{importantCount}</span>
							</div>
						</div>

						<button
							onClick={() => startRefresh(() => fetchNotifications())}
							className="px-3 py-2 bg-surface text-text-secondary rounded-lg hover:bg-card-hover transition-colors duration-200 flex items-center space-x-2"
							disabled={isRefreshing || loading}
						>
							<RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
							<span>Refresh</span>
						</button>

						<button
							onClick={markAllAsRead}
							className="px-4 py-2 bg-accent text-text-inverse rounded-lg hover:bg-accent-hover transition-colors duration-200 flex items-center space-x-2"
							disabled={unreadCount === 0}
						>
							<Check className="h-4 w-4" />
							<span>Tandai Semua Dibaca</span>
						</button>

						<button
							onClick={deleteAllNotifications}
							className="px-3 py-2 bg-surface text-red-600 rounded-lg hover:bg-card-hover transition-colors duration-200 flex items-center space-x-2"
							disabled={notifications.length === 0}
						>
							<Trash2 className="h-4 w-4" />
							<span>Hapus Semua</span>
						</button>
					</div>
				</div>

				{/* Controls */}
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
						<Search className="h-4 w-4 text-text-secondary" />
						<input
							type="text"
							placeholder="Cari notifikasi..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="bg-transparent outline-none text-sm"
						/>
					</div>
					<button className="px-3 py-2 rounded-lg bg-surface text-text-secondary hover:bg-card-hover inline-flex items-center gap-2">
						<Filter className="h-4 w-4" /> Filter
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-slate-200 dark:border-slate-700">
					{([
						{ key: "all", label: "Semua" },
						{ key: "unread", label: "Belum Dibaca" },
						{ key: "important", label: "Penting" },
					] as const).map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={`px-4 py-2 text-sm font-medium ${
								activeTab === tab.key
									? "text-accent border-b-2 border-blue-600 dark:border-blue-400"
								: "text-text-secondary hover:text-slate-900 dark:hover:text-white"
							}`}
						>
							{tab.label}
							{tab.key === "unread" && unreadCount > 0 && (
								<span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
									{unreadCount}
								</span>
							)}
							{tab.key === "important" && importantCount > 0 && (
								<span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full">
									{importantCount}
								</span>
							)}
						</button>
					))}
				</div>

				{/* List */}
				<div className="rounded-lg border border-border bg-surface">
					<ScrollArea className="max-h-[70vh]">
						{loading && (
							<div className="p-6 text-sm text-text-secondary">Memuat notifikasi...</div>
						)}
						{!loading && filtered.length === 0 && (
							<div className="p-10 text-center text-text-secondary">Tidak ada notifikasi</div>
						)}
						<ul className="divide-y divide-border">
							{filtered.map((n) => (
								<li key={n.id} className={`p-4 transition-all duration-200 transform hover:scale-[1.01] ${
									n.isRead 
										? 'hover:bg-card-hover' 
										: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-500 dark:border-blue-400 hover:shadow-md'
								}`}>
									<div className="flex items-start gap-3">
										<div className="mt-1">{iconByType(n.type)}</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<h3 className={`text-sm font-medium ${n.isRead ? "text-text-secondary" : "text-blue-900 dark:text-blue-100 font-semibold"}`}>
														{n.title}
													</h3>
													{!n.isRead && (
														<span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse shadow-lg ring-2 ring-blue-200 dark:ring-blue-800/50"></span>
													)}
												</div>
												<div className="flex items-center gap-2 text-xs text-text-secondary">
													<Clock className="h-3.5 w-3.5" />
													<span>{new Date(n.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
												</div>
											</div>
											<p className={`mt-1 text-sm line-clamp-3 ${n.isRead ? "text-text-secondary" : "text-blue-800 dark:text-blue-200"}`}>{n.message}</p>
											<div className="mt-3 flex items-center gap-2">
												<button
													onClick={() => toggleImportant(n.id, !!n.important)}
													className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors ${
														n.important
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
															: "bg-surface hover:bg-card-hover text-text-secondary"
													}`}
												>
													<Bookmark className="h-3.5 w-3.5" />
													{n.important ? "Diutamakan" : "Tandai penting"}
												</button>
												{!n.isRead && (
													<button
														onClick={() => markAsRead(n.id)}
														className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs bg-surface hover:bg-card-hover text-text-secondary"
													>
														<Check className="h-3.5 w-3.5" />
														Tandai dibaca
													</button>
												)}
												<button
													onClick={() => deleteNotification(n.id)}
													className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs bg-surface hover:bg-card-hover text-red-600"
												>
													<Trash2 className="h-3.5 w-3.5" />
													Hapus
												</button>
												{/* Buka dihilangkan sesuai permintaan */}
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					</ScrollArea>
				</div>
			</div>
		</AdminLayout>
	)
}
