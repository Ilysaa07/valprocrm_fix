import fs from 'fs'
import path from 'path'

export interface HolidayDefinition {
	date: string
	name: string
}

interface HolidaysConfig {
	version: number
	fixed: HolidayDefinition[]
	dates: HolidayDefinition[]
}

let cachedConfig: HolidaysConfig | null = null

function loadConfig(): HolidaysConfig {
	if (cachedConfig) return cachedConfig
	const filePath = path.join(process.cwd(), 'public', 'holidays.json')
	try {
		const data = fs.readFileSync(filePath, 'utf-8')
		cachedConfig = JSON.parse(data) as HolidaysConfig
		return cachedConfig
	} catch {
		cachedConfig = { version: 1, fixed: [], dates: [] }
		return cachedConfig
	}
}

export function isHoliday(date: Date): { isHoliday: boolean; name?: string } {
	const cfg = loadConfig()
	const yyyy = date.getFullYear()
	const mm = String(date.getMonth() + 1).padStart(2, '0')
	const dd = String(date.getDate()).padStart(2, '0')
	const iso = `${yyyy}-${mm}-${dd}`

	for (const d of cfg.dates) {
		if (d.date === iso) return { isHoliday: true, name: d.name }
	}
	for (const f of cfg.fixed) {
		if (f.date.trim() === '* * 0' && date.getDay() === 0) return { isHoliday: true, name: f.name }
	}
	return { isHoliday: false }
}
