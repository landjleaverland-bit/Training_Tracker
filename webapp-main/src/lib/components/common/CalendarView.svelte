<script lang="ts">
	import type { Session } from '$lib/types/session';

	interface Props {
		sessions?: Session[];
		selectedDate?: string;
		activityType?: string;
	}

	let { sessions = [], selectedDate = $bindable(''), activityType = '' }: Props = $props();

	// Current month view (independent of selectedDate, starts at current real month)
	let currentViewDate = $state(new Date());

	// Compute month days grid
	let calendarDays = $derived.by(() => {
		const year = currentViewDate.getFullYear();
		const month = currentViewDate.getMonth();

		const firstDayOfMonth = new Date(year, month, 1);
		const lastDayOfMonth = new Date(year, month + 1, 0);

		// 0 = Sunday, 1 = Monday, ... 6 = Saturday
		// We want Monday = 0, ..., Sunday = 6
		let firstDayIndex = firstDayOfMonth.getDay() - 1;
		if (firstDayIndex === -1) firstDayIndex = 6;

		const daysInMonth = lastDayOfMonth.getDate();
		
		const days = [];
		// Padding previous month days
		for (let i = 0; i < firstDayIndex; i++) {
			days.push({ day: 0, dateStr: '' }); // empty cell
		}

		// Current month days
		for (let i = 1; i <= daysInMonth; i++) {
			// Format YYYY-MM-DD
			const m = String(month + 1).padStart(2, '0');
			const d = String(i).padStart(2, '0');
			days.push({ day: i, dateStr: `${year}-${m}-${d}` });
		}

		// Padding next month days to complete 6 rows (42 cells always, or just enough to finish the row)
        const totalCells = Math.ceil(days.length / 7) * 7;
        while (days.length < totalCells) {
            days.push({ day: 0, dateStr: '' });
        }

		return days;
	});

	// Determine activity types per day
	let dayTypes = $derived.by(() => {
		if (activityType === 'combined') {
			const data: Record<string, string[]> = {};
			for (const s of sessions) {
				const d = s.date;
				if (!data[d]) data[d] = [];
				if (!data[d].includes(s.activityType)) data[d].push(s.activityType);
			}
			const result: Record<string, string> = {};
			for (const [date, types] of Object.entries(data)) {
				if (types.length > 1) result[date] = 'multiple';
				else result[date] = types[0];
			}
			return result;
		}

		const data: Record<string, { boulder: boolean; sport: boolean; other: boolean }> = {};

		for (const s of sessions) {
			const d = s.date;
			if (!data[d]) {
				data[d] = { boulder: false, sport: false, other: false };
			}

			if (s.activityType === 'indoor_climb' || s.activityType === 'outdoor_climb') {
				const ct = (s as any).climbingType;
				if (ct === 'Bouldering') data[d].boulder = true;
				else if (ct === 'Sport' || ct === 'Leading' || ct === 'Trad') data[d].sport = true;
				else if (ct === 'Mixed') {
					data[d].boulder = true;
					data[d].sport = true;
				} else {
                    // Check climbs if available
                    const climbs = (s as any).climbs || [];
                    if (climbs.length > 0) {
                        for (const c of climbs) {
                            if (c.isSport) data[d].sport = true;
                            else data[d].boulder = true;
                        }
                    } else {
                        data[d].other = true;
                    }
                }
			} else if (s.activityType === 'competition') {
				const ct = (s as any).type;
				if (ct === 'Bouldering') data[d].boulder = true;
				else if (ct === 'Lead' || ct === 'Speed') data[d].sport = true;
                else data[d].other = true;
			} else {
				data[d].other = true;
			}
		}

		const result: Record<string, string> = {};
		for (const [date, info] of Object.entries(data)) {
			if (info.boulder && info.sport) result[date] = 'mixed';
			else if (info.boulder) result[date] = 'boulder';
			else if (info.sport) result[date] = 'sport';
			else result[date] = 'other';
		}
		return result;
	});

	function prevMonth() {
		currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
	}

	function selectDay(dateStr: string) {
		if (!dateStr) return;
        // Toggle off if re-clicked
        if (selectedDate === dateStr) {
            selectedDate = '';
        } else {
            selectedDate = dateStr;
        }
	}

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
</script>

<div class="calendar-wrapper">
	<div class="calendar-header">
		<button class="nav-btn" aria-label="Previous Month" onclick={prevMonth}>‹</button>
		<div class="month-title">
			{monthNames[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
		</div>
		<button class="nav-btn" aria-label="Next Month" onclick={nextMonth}>›</button>
	</div>

	<div class="weekdays">
		<span>Mo</span>
		<span>Tu</span>
		<span>We</span>
		<span>Th</span>
		<span>Fr</span>
		<span>Sa</span>
		<span>Su</span>
	</div>

	<div class="days-grid">
		{#each calendarDays as dayCell}
			{#if dayCell.day === 0}
				<div class="day empty"></div>
			{:else}
				{@const dType = dayTypes[dayCell.dateStr]}
				{@const isSelected = selectedDate === dayCell.dateStr}
				<button 
					class="day {dType ? 'has-data' : ''} {dType ? `type-${dType}` : ''} {isSelected ? 'selected' : ''}"
					onclick={() => selectDay(dayCell.dateStr)}
					title={dType ? `Sessions present on ${dayCell.dateStr}` : `No sessions on ${dayCell.dateStr}`}
				>
					{dayCell.day}
				</button>
			{/if}
		{/each}
	</div>

	{#if activityType === 'combined'}
		<div class="calendar-legend">
			<div class="legend-item"><span class="box type-indoor_climb"></span> Indoor</div>
			<div class="legend-item"><span class="box type-outdoor_climb"></span> Outdoor</div>
			<div class="legend-item"><span class="box type-gym_session"></span> Gym</div>
			<div class="legend-item"><span class="box type-fingerboarding"></span> Fingerboard</div>
			<div class="legend-item"><span class="box type-competition"></span> Comp</div>
			<div class="legend-item"><span class="box type-multiple"></span> Multiple</div>
		</div>
	{:else if activityType === 'indoor_climb' || activityType === 'outdoor_climb' || activityType === 'competition'}
		<div class="calendar-legend">
			<div class="legend-item"><span class="box type-boulder"></span> Bouldering</div>
			<div class="legend-item"><span class="box type-sport"></span> Sport / Lead</div>
			<div class="legend-item" title="Both Bouldering and Sport on this day">
                <span class="box type-mixed"></span> Mixed / Both
            </div>
		</div>
	{/if}
</div>

<style>
	.calendar-wrapper {
		background: white;
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 2px 12px rgba(74, 155, 155, 0.1);
		border: 1px solid rgba(74, 155, 155, 0.2);
		margin-top: 1rem;
        margin-bottom: 0.5rem;
        animation: fadeIn 0.2s ease;
	}

    @keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.nav-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--teal-secondary);
		cursor: pointer;
		padding: 0 0.5rem;
		border-radius: 4px;
        transition: background 0.2s;
	}

	.nav-btn:hover {
		background: rgba(74, 155, 155, 0.1);
	}

	.month-title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.1rem;
	}

	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 6px;
	}

	.day {
        aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.02);
		border: 2px solid transparent;
		border-radius: 8px;
		font-size: 0.95rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s ease;
        padding: 0; /* reset button padding */
        font-family: inherit;
	}

	.day.empty {
		background: transparent;
		cursor: default;
	}

	.day:not(.empty):hover {
		border-color: rgba(74, 155, 155, 0.4);
	}

    /* Coloring days (entire box) */
	.day.type-boulder {
		background: rgba(66, 165, 245, 0.3); /* Blueish */
        color: #0d47a1;
        font-weight: 600;
	}
	.day.type-sport {
		background: rgba(239, 83, 80, 0.3); /* Reddish */
        color: #b71c1c;
        font-weight: 600;
	}
	.day.type-mixed {
		background: linear-gradient(135deg, rgba(66, 165, 245, 0.4) 0%, rgba(66, 165, 245, 0.4) 49%, rgba(239, 83, 80, 0.4) 51%, rgba(239, 83, 80, 0.4) 100%);
        color: #333;
        font-weight: 600;
	}
	.day.type-other {
		background: rgba(74, 155, 155, 0.3); /* Teal/Generic */
        color: #004d40;
        font-weight: 600;
	}
	.day.type-indoor_climb {
		background: rgba(66, 165, 245, 0.3); /* Blue */
		color: #0d47a1;
		font-weight: 600;
	}
	.day.type-outdoor_climb {
		background: rgba(129, 199, 132, 0.3); /* Green */
		color: #1b5e20;
		font-weight: 600;
	}
	.day.type-gym_session {
		background: rgba(255, 183, 77, 0.3); /* Orange */
		color: #e65100;
		font-weight: 600;
	}
	.day.type-fingerboarding {
		background: rgba(149, 117, 205, 0.3); /* Purple */
		color: #4a148c;
		font-weight: 600;
	}
	.day.type-competition {
		background: rgba(239, 83, 80, 0.3); /* Red */
		color: #b71c1c;
		font-weight: 600;
	}
	.day.type-multiple {
		background: linear-gradient(135deg, rgba(66, 165, 245, 0.4) 0%, rgba(129, 199, 132, 0.4) 100%);
		color: #333;
		font-weight: 600;
	}

	.day.selected {
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 2px var(--teal-secondary);
        transform: scale(1.05);
        z-index: 2;
	}

	.calendar-legend {
		display: flex;
		gap: 1.5rem;
		margin-top: 1.25rem;
		justify-content: center;
        flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.box {
		width: 14px;
		height: 14px;
		border-radius: 3px;
	}

	.box.type-boulder { background: rgba(66, 165, 245, 0.5); }
	.box.type-sport { background: rgba(239, 83, 80, 0.5); }
	.box.type-mixed { background: linear-gradient(135deg, rgba(66, 165, 245, 0.5) 50%, rgba(239, 83, 80, 0.5) 50%); }
	.box.type-indoor_climb { background: rgba(66, 165, 245, 0.5); }
	.box.type-outdoor_climb { background: rgba(129, 199, 132, 0.5); }
	.box.type-gym_session { background: rgba(255, 183, 77, 0.5); }
	.box.type-fingerboarding { background: rgba(149, 117, 205, 0.5); }
	.box.type-competition { background: rgba(239, 83, 80, 0.5); }
	.box.type-multiple { background: linear-gradient(135deg, rgba(66, 165, 245, 0.5) 50%, rgba(129, 199, 132, 0.5) 50%); }
</style>
