<script lang="ts">
    import { onMount } from 'svelte';
    import { getAllSessions } from '$lib/services/cache';
    import type { Session } from '$lib/types/session';
    import { 
        getClimbingVsRestStats, 
        getFingerboardingConsistency, 
        getSessionTypeBreakdown,
        getTrainingSystemStats,
        getGradeStats,
        getIndoorLocationStats,
        getOutdoorCragStats,
        getOutdoorAreaStats,
        getWeeklyLoadStats,
        getMaxHangStats,
        getGripLoadStats,
        getRecruitmentStats,
        getMaxPickupStats
    } from '$lib/utils/stats';
    import * as d3 from 'd3';
    
    import PieChart from '$lib/components/PieChart.svelte';
    import BarChart from '$lib/components/BarChart.svelte';
    import LineChart from '$lib/components/LineChart.svelte';

    let sessions = $state<Session[]>([]);
    let selectedView = $state('general');
    let timeRange = $state<'week' | 'month' | 'specific_week' | 'specific_month' | 'all'>('all');
    let selectedDateValue = $state('');

    onMount(() => {
        sessions = getAllSessions();
    });

    // Filtered Sessions
    let filteredSessions = $derived.by(() => {
        if (timeRange === 'all') return sessions;

        const now = new Date();
        const cutoff = new Date();

        if (timeRange === 'week') {
            cutoff.setDate(now.getDate() - 7);
            return sessions.filter(s => new Date(s.date) >= cutoff);
        } else if (timeRange === 'month') {
            cutoff.setMonth(now.getMonth() - 1);
            return sessions.filter(s => new Date(s.date) >= cutoff);
        } else if (timeRange === 'specific_week' && selectedDateValue) {
             // value is "YYYY-Www" (e.g. 2024-W05)
             // We'll parse the date and check if it falls in that ISO week
             // Simple approach: d3.timeParse("%Y-W%V") or check ISO string
             // HTML input week is ISO week
             const [yearStr, weekStr] = selectedDateValue.split('-W');
             const year = parseInt(yearStr);
             const week = parseInt(weekStr);
             
             // Filter
             // Helper to get ISO week from a date
             const getISOWeek = (d: Date) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
             };
             
             return sessions.filter(s => {
                 const d = new Date(s.date);
                 return d.getFullYear() === year && getISOWeek(d) === week;
             });

        } else if (timeRange === 'specific_month' && selectedDateValue) {
            // value is "YYYY-MM"
             return sessions.filter(s => s.date.startsWith(selectedDateValue));
        }

        return sessions;
    });

    // --- Derived Data for Views ---

    // 1. General
    let climbVsRest = $derived(getClimbingVsRestStats(filteredSessions));
    let fbConsistency = $derived(getFingerboardingConsistency(filteredSessions));
    let sessionTypes = $derived(getSessionTypeBreakdown(filteredSessions));

    // 2. Training Systems
    let trainingSystems = $derived(getTrainingSystemStats(filteredSessions));

    // 3. Performance Grade
    let boulderGrades = $derived(getGradeStats(filteredSessions, 'boulder'));
    let leadGrades = $derived(getGradeStats(filteredSessions, 'lead'));

    // 4. Venue
    let indoorVenues = $derived(getIndoorLocationStats(filteredSessions));
    let outdoorVenues = $derived(getOutdoorCragStats(filteredSessions));
    let outdoorAreas = $derived(getOutdoorAreaStats(filteredSessions));

    // 5. Periodization
    let weeklyLoad = $derived(getWeeklyLoadStats(filteredSessions));

    // 6. Finger Strength
    let maxHangData = $derived(getMaxHangStats(filteredSessions));
    let gripLoadData = $derived(getGripLoadStats(filteredSessions));
    let recruitmentData = $derived(getRecruitmentStats(filteredSessions));
    let maxPickupData = $derived(getMaxPickupStats(filteredSessions));


    // View Options
    const views = [
        { id: 'general', label: 'General Activity & Volume' },
        { id: 'systems', label: 'Training System Breakdown' },
        { id: 'grades', label: 'Performance Grade Pyramids' },
        { id: 'venues', label: 'Venue & Location Analysis' },
        { id: 'periodization', label: 'Periodization & Planning' },
        { id: 'strength', label: 'Finger Strength Metrics' },
    ];

    let currentViewLabel = $derived(views.find(v => v.id === selectedView)?.label);

</script>

<div class="page">
    <div class="page-header">
        <h1>📈 Plot Data</h1>
        <p class="subtitle">Visualize your progress</p>
    </div>

    <!-- Controls -->
    <div class="controls-card">
        <label for="view-select">Select Analysis:</label>
        <div class="select-wrapper">
            <select id="view-select" bind:value={selectedView}>
                {#each views as view}
                    <option value={view.id}>{view.label}</option>
                {/each}
            </select>
            <div class="select-arrow">▼</div>
        </div>

        <label for="time-select" style="margin-top: 1rem;">Time Range:</label>
        <div class="select-wrapper">
            <select id="time-select" bind:value={timeRange}>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="specific_week">Specific Week</option>
                <option value="specific_month">Specific Month</option>
                <option value="all">All Time</option>
            </select>
            <div class="select-arrow">▼</div>
        </div>

        {#if timeRange === 'specific_week'}
            <div class="specific-date-input" style="margin-top: 0.5rem;">
                <input type="week" bind:value={selectedDateValue} class="date-picker" />
            </div>
        {:else if timeRange === 'specific_month'}
             <div class="specific-date-input" style="margin-top: 0.5rem;">
                <input type="month" bind:value={selectedDateValue} class="date-picker" />
            </div>
        {/if}
    </div>
    
    <!-- Content Area -->
    <div class="content-card">
        <h2 class="view-title">{currentViewLabel}</h2>

        {#if sessions.length === 0}
            <div class="empty-state">
                <p>No sessions found. Log some data to see charts!</p>
            </div>
        {:else}
            
            {#if selectedView === 'general'}
                <div class="chart-grid">
                    <div class="chart-card">
                        <h3>Climbing vs Rest</h3>
                        <PieChart data={climbVsRest} valueAccessor={d => d.value} labelAccessor={d => d.label} colorAccesor={d => d.color} />
                    </div>
                    <div class="chart-card">
                        <h3>Fingerboarding Consistency</h3>
                        <PieChart data={fbConsistency} valueAccessor={d => d.value} labelAccessor={d => d.label} colorAccesor={d => d.color} />
                    </div>
                    <div class="chart-card full-width">
                        <h3>Session Type Breakdown</h3>
                        <BarChart 
                            data={sessionTypes} 
                            xAccessor={d => d.label} 
                            yAccessor={d => d.value} 
                            orientation="vertical"
                            height={300}
                        />
                    </div>
                </div>

            {:else if selectedView === 'systems'}
                <div class="chart-card full-width">
                    <h3>Energy Systems Profile</h3>
                    {#if trainingSystems.length > 0}
                        <BarChart 
                            data={trainingSystems} 
                            xAccessor={d => d.label} 
                            yAccessor={d => d.value} 
                            orientation="horizontal"
                            marginLeft={140}
                            color="#E6B72B"
                        />
                    {:else}
                        <p class="no-data">No energy system data recorded.</p>
                    {/if}
                </div>

            {:else if selectedView === 'grades'}
                <div class="chart-grid">
                    <div class="chart-card full-width">
                        <h3>Boulder Grade Pyramid</h3>
                        {#if boulderGrades.length > 0}
                             <BarChart 
                                data={boulderGrades} 
                                xAccessor={d => d.label} 
                                yAccessor={d => d.value} 
                                orientation="vertical"
                                color="#4A9B9B"
                            />
                        {:else}
                            <p class="no-data">No climbs with grades recorded.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                        <h3>Lead/Sport Grade Pyramid</h3>
                        {#if leadGrades.length > 0}
                             <BarChart 
                                data={leadGrades} 
                                xAccessor={d => d.label} 
                                yAccessor={d => d.value} 
                                orientation="vertical"
                                color="#E6B72B"
                            />
                        {:else}
                            <p class="no-data">No sport climbs recorded.</p>
                        {/if}
                    </div>
                </div>

            {:else if selectedView === 'venues'}
                <div class="chart-card full-width">
                    <h3>Indoor Gym Frequency</h3>
                    {#if indoorVenues.length > 0}
                        <BarChart 
                            data={indoorVenues} 
                            xAccessor={d => d.label} 
                            yAccessor={d => d.value} 
                            orientation="horizontal"
                            marginLeft={150}
                            color="#2E8B8B"
                        />
                    {:else}
                         <p class="no-data">No indoor sessions recorded.</p>
                    {/if}
                </div>

                <div class="chart-card full-width">
                    <h3>Outdoor Crag Frequency</h3>
                    {#if outdoorVenues.length > 0}
                        <BarChart 
                            data={outdoorVenues} 
                            xAccessor={d => d.label} 
                            yAccessor={d => d.value} 
                            orientation="horizontal"
                            marginLeft={150}
                            color="#F4C430"
                        />
                    {:else}
                        <p class="no-data">No outdoor sessions recorded.</p>
                    {/if}
                </div>

                <div class="chart-card full-width">
                    <h3>Outdoor Area Frequency</h3>
                    {#if outdoorAreas.length > 0}
                        <BarChart 
                            data={outdoorAreas} 
                            xAccessor={d => d.label} 
                            yAccessor={d => d.value} 
                            orientation="horizontal"
                            marginLeft={150}
                            color="#8B4513"
                        />
                    {:else}
                        <p class="no-data">No outdoor sessions recorded.</p>
                    {/if}
                </div>

            {:else if selectedView === 'periodization'}
                <div class="chart-card full-width">
                    <h3>Weekly Training Load</h3>
                    {#if weeklyLoad.length > 0}
                         <BarChart 
                            data={weeklyLoad} 
                            xAccessor={d => d3.timeFormat("%Y-%W")(d.date)} 
                            yAccessor={d => d.value} 
                            orientation="vertical"
                            color="#F4C430"
                        />
                    {:else}
                        <p class="no-data">No load metrics available.</p>
                    {/if}
                </div>

            {:else if selectedView === 'strength'}
                 <div class="chart-grid">
                    <div class="chart-card full-width">
                        <h3>Weekly Grip Load (Subjective 1-5)</h3>
                         {#if gripLoadData.length > 0}
                            <LineChart 
                                data={gripLoadData} 
                                xAccessor={d => d.date} 
                                yAccessor={d => d.value}
                                zAccessor={d => d.series}
                            />
                        {:else}
                             <p class="no-data">No grip load data recorded.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                        <h3>Max Hang Progression (Kg)</h3>
                        {#if maxHangData.length > 0}
                            <LineChart 
                                data={maxHangData} 
                                xAccessor={d => d.date} 
                                yAccessor={d => d.value}
                                zAccessor={d => d.series}
                            />
                        {:else}
                            <p class="no-data">No max hang data recorded in Fingerboarding sessions.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                         <h3>Recruitment Pulls (Max Weight)</h3>
                         {#if recruitmentData.length > 0}
                            <LineChart 
                                data={recruitmentData}
                                xAccessor={d => d.date}
                                yAccessor={d => d.value}
                                 seriesAccessor={d => d.series}
                                color="#9B59B6"
                            />
                        {:else}
                            <p class="no-data">No recruitment pulls recorded.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                         <h3>Max Pick-ups (Max Weight)</h3>
                         {#if maxPickupData.length > 0}
                            <LineChart 
                                data={maxPickupData}
                                xAccessor={d => d.date}
                                yAccessor={d => d.value}
                                 seriesAccessor={d => d.series}
                                color="#3498DB"
                            />
                        {:else}
                            <p class="no-data">No max pick-ups recorded.</p>
                        {/if}
                    </div>
                 </div>
            {/if}

        {/if}
    </div>
</div>

<style>
    .page {
        animation: fadeIn 0.3s ease;
        padding-bottom: 2rem;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
        margin-bottom: 1.5rem;
    }

    .page-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--teal-secondary);
        margin: 0 0 0.5rem 0;
    }

    .subtitle {
        color: var(--text-secondary);
        font-size: 1rem;
        margin: 0;
    }

    .controls-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    .controls-card label {
        font-weight: 600;
        color: var(--text-primary);
    }

    .select-wrapper {
        position: relative;
        flex: 1;
        min-width: 200px;
    }

    select {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 1px solid #ddd;
        font-size: 1rem;
        appearance: none;
        background: white;
        color: var(--text-primary);
        cursor: pointer;
    }

    .select-arrow {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--text-secondary);
        font-size: 0.8rem;
    }

    .content-card {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 20px rgba(74, 155, 155, 0.1);
        border: 1px solid rgba(74, 155, 155, 0.15);
    }

    .view-title {
        color: var(--text-primary);
        margin-top: 0;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid var(--gold-primary);
        display: inline-block;
        padding-bottom: 0.25rem;
    }

    /* Grid Layout */
    .chart-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        border: 1px solid #eee;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .chart-card h3 {
        margin-top: 0;
        font-size: 1.1rem;
        color: var(--text-secondary);
        text-align: center;
        margin-bottom: 1rem;
    }

    .full-width {
        grid-column: 1 / -1;
    }

    .empty-state, .no-data {
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
        padding: 2rem;
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
        .chart-grid {
            grid-template-columns: 1fr;
        }
        
        .content-card {
            padding: 1rem;
        }
    }
</style>
