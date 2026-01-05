<script lang="ts">
    import { onMount } from 'svelte';
    import { 
        getIndoorSessions, 
        getOutdoorSessions, 
        getGymSessions, 
        getFingerboardSessions, 
        getCompetitionSessions 
    } from '$lib/services/api';
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
        getMaxPickupStats,
        getLoadStats,
        movingAverage
    } from '$lib/utils/stats';
    import * as d3 from 'd3';
    
    import PieChart from '$lib/components/PieChart.svelte';
    import BarChart from '$lib/components/BarChart.svelte';
    import StackedBarChart from '$lib/components/StackedBarChart.svelte';
    import LineChart from '$lib/components/LineChart.svelte';

    // Colors: Flash(Blue), Redpoint(Green), Dogged(Orange), DNF(Red)
    const gradeStackKeys = ['flashCount', 'redpointCount', 'doggedCount', 'dnfCount'];
    const gradeStackColors = ['#3B82F6', '#22C55E', '#F97316', '#EF4444'];
    const gradeStackLabels = ['Flash/Onsight', 'Redpoint', 'Dogged', 'DNF'];


    let sessions = $state<Session[]>([]);
    let selectedView = $state('general');
    let timeRange = $state<'week' | 'month' | 'year' | 'specific_week' | 'specific_month' | 'specific_year' | 'all'>('all');
    let selectedDateValue = $state('');

    onMount(async () => {
        const [indoor, outdoor, gym, finger, comp] = await Promise.all([
            getIndoorSessions(),
            getOutdoorSessions(),
            getGymSessions(),
            getFingerboardSessions(),
            getCompetitionSessions()
        ]);

        const all = [
            ...(indoor.data || []),
            ...(outdoor.data || []),
            ...(gym.data || []),
            ...(finger.data || []),
            ...(comp.data || [])
        ];
        
        // Sort by date desc
        all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Cast to Session[] if needed, assuming remote types satisfy Session union
        sessions = all as Session[];
    });

    // Available years for dropdown
    let availableYears = $derived.by(() => {
        const years = new Set(sessions.map(s => new Date(s.date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a); // Descending
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
        } else if (timeRange === 'year') {
            cutoff.setFullYear(now.getFullYear() - 1);
            return sessions.filter(s => new Date(s.date) >= cutoff);
        } else if (timeRange === 'specific_week' && selectedDateValue) {
             const [yearStr, weekStr] = selectedDateValue.split('-W');
             const year = parseInt(yearStr);
             const week = parseInt(weekStr);
             
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
        } else if (timeRange === 'specific_year' && selectedDateValue) {
             return sessions.filter(s => s.date.startsWith(selectedDateValue));
        }

        return sessions;
    });

    // Determine date range for zero-filling
    let currentDateRange = $derived.by(() => {
        const now = new Date();
        const end = new Date();
        const start = new Date();

        if (timeRange === 'week') {
            start.setDate(now.getDate() - 6); // Last 7 days inclusive
            return { start, end };
        } else if (timeRange === 'month') {
            start.setMonth(now.getMonth() - 1);
            return { start, end };
        } else if (timeRange === 'year') {
            start.setFullYear(now.getFullYear() - 1);
            return { start, end };
        } else if (timeRange === 'specific_week' && selectedDateValue) {
             const [yearStr, weekStr] = selectedDateValue.split('-W');
             const year = parseInt(yearStr);
             const week = parseInt(weekStr);
             
             // Calculate start of ISO week
             const simple = new Date(year, 0, 1 + (week - 1) * 7);
             const dow = simple.getDay();
             const ISOweekStart = simple;
             if (dow <= 4)
                 ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
             else
                 ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
             
             const wStart = new Date(ISOweekStart);
             const wEnd = new Date(ISOweekStart);
             wEnd.setDate(wEnd.getDate() + 6);
             return { start: wStart, end: wEnd };

        } else if (timeRange === 'specific_month' && selectedDateValue) {
             const [year, month] = selectedDateValue.split('-');
             const mStart = new Date(parseInt(year), parseInt(month) - 1, 1);
             const mEnd = new Date(parseInt(year), parseInt(month), 0);
             return { start: mStart, end: mEnd };
        } else if (timeRange === 'specific_year' && selectedDateValue) {
            const year = parseInt(selectedDateValue);
            const mStart = new Date(year, 0, 1);
            const mEnd = new Date(year, 11, 31);
            return { start: mStart, end: mEnd };
        }
        
        return undefined; // All time
    });

    // --- Derived Data for Views ---

    // 1. General
    // Pass currentDateRange to fix "Rest Days" calculation using today instead of range end
    let climbVsRest = $derived(getClimbingVsRestStats(filteredSessions, currentDateRange));
    let fbConsistency = $derived(getFingerboardingConsistency(filteredSessions, currentDateRange));
    let sessionTypes = $derived(getSessionTypeBreakdown(filteredSessions));

    // 2. Training Systems
    let trainingSystems = $derived(getTrainingSystemStats(filteredSessions));

    // 3. Performance Grade
    let indoorBoulderGrades = $derived(getGradeStats(filteredSessions, 'boulder', 'indoor'));
    let outdoorBoulderGrades = $derived(getGradeStats(filteredSessions, 'boulder', 'outdoor'));
    let indoorLeadGrades = $derived(getGradeStats(filteredSessions, 'lead', 'indoor'));
    let outdoorLeadGrades = $derived(getGradeStats(filteredSessions, 'lead', 'outdoor'));

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

    // 7. Load Tracking (15 Graphs)
    // Helper to combine Raw + Average
    const withAvg = (data: any[], name: string) => {
        if (data.length === 0) return [];
        return [...data, ...movingAverage(data, 4)]; // 4-period moving average
    };

    // Determine granularity for load tracking
    let loadGranularity = $derived.by(() => {
        if (['week', 'month', 'specific_week', 'specific_month'].includes(timeRange)) {
            return 'day';
        }
        return 'week' as 'week' | 'day';
    });



    // 7.1 Activities (Count)
    let loadClimbing = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType.includes('climb'), s => 1, 'Climbing Sessions', loadGranularity, currentDateRange), 'Climbing Sessions'));
    let loadFingerboard = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType === 'fingerboarding', s => 1, 'Fingerboarding', loadGranularity, currentDateRange), 'Fingerboarding'));
    let loadIndoorBoulder = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType === 'indoor_climb' && (s as any).climbingType === 'Boulder', s => 1, 'Indoor Bouldering', loadGranularity, currentDateRange), 'Indoor Bouldering'));
    let loadOutdoorBoulder = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType === 'outdoor_climb' && (s as any).climbingType === 'Boulder', s => 1, 'Outdoor Bouldering', loadGranularity, currentDateRange), 'Outdoor Bouldering'));
    let loadIndoorLead = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType === 'indoor_climb' && (s as any).climbingType === 'Lead', s => 1, 'Indoor Leading', loadGranularity, currentDateRange), 'Indoor Leading')); 
    let loadOutdoorLead = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType === 'outdoor_climb' && ['Sport','Trad'].includes((s as any).climbingType), s => 1, 'Outdoor Leading', loadGranularity, currentDateRange), 'Outdoor Leading'));
    let loadComps = $derived(withAvg(getLoadStats(filteredSessions, s => s.activityType === 'competition', s => 1, 'Competitions', loadGranularity, currentDateRange), 'Competitions'));

    // 7.2 Body Parts (Load Sum)
    let loadShoulders = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).shoulderLoad, s => (s as any).shoulderLoad || 0, 'Shoulders', loadGranularity, currentDateRange), 'Shoulders'));
    let loadForearms = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).forearmLoad, s => (s as any).forearmLoad || 0, 'Forearms', loadGranularity, currentDateRange), 'Forearms'));
    let loadFingers = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).fingerLoad, s => (s as any).fingerLoad || 0, 'Fingers', loadGranularity, currentDateRange), 'Fingers'));

    // 7.3 Grips (Grip Sum)
    let loadOpen = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).openGrip, s => (s as any).openGrip || 0, 'Open Grips', loadGranularity, currentDateRange), 'Open Grips'));
    let loadCrimp = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).crimpGrip, s => (s as any).crimpGrip || 0, 'Crimps', loadGranularity, currentDateRange), 'Crimps'));
    let loadPinch = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).pinchGrip, s => (s as any).pinchGrip || 0, 'Pinches', loadGranularity, currentDateRange), 'Pinches'));
    let loadSloper = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).sloperGrip, s => (s as any).sloperGrip || 0, 'Slopers', loadGranularity, currentDateRange), 'Slopers'));
    let loadJug = $derived(withAvg(getLoadStats(filteredSessions, s => !!(s as any).jugGrip, s => (s as any).jugGrip || 0, 'Jugs', loadGranularity, currentDateRange), 'Jugs'));


    // View Options
    const views = [
        { id: 'general', label: 'General Activity & Volume' },
        { id: 'systems', label: 'Training System Breakdown' },
        { id: 'grades', label: 'Performance Grade Pyramids' },
        { id: 'venues', label: 'Venue & Location Analysis' },
        { id: 'periodization', label: 'Periodization & Planning' },
        { id: 'strength', label: 'Finger Strength Metrics' },
        { id: 'load', label: 'Load Tracking' },
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
                <option value="year">Past Year</option>
                <option value="specific_week">Specific Week</option>
                <option value="specific_month">Specific Month</option>
                <option value="specific_year">Specific Year</option>
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
        {:else if timeRange === 'specific_year'}
            <div class="select-wrapper" style="margin-top: 0.5rem;">
                <select bind:value={selectedDateValue} class="date-picker">
                    <option value="" disabled selected>Select Year</option>
                    {#each availableYears as year}
                        <option value={String(year)}>{year}</option>
                    {/each}
                </select>
                <div class="select-arrow">▼</div>
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
                        <h3>🧗 Indoor Boulder Grades</h3>
                        {#if indoorBoulderGrades.length > 0}
                             <StackedBarChart 
                                data={indoorBoulderGrades} 
                                xAccessor={d => d.label} 
                                keys={gradeStackKeys}
                                colors={gradeStackColors}
                                labels={gradeStackLabels}
                            />
                        {:else}
                            <p class="no-data">No indoor boulders recorded.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                        <h3>⛰️ Outdoor Boulder Grades</h3>
                        {#if outdoorBoulderGrades.length > 0}
                             <StackedBarChart 
                                data={outdoorBoulderGrades} 
                                xAccessor={d => d.label} 
                                keys={gradeStackKeys}
                                colors={gradeStackColors}
                                labels={gradeStackLabels}
                            />
                        {:else}
                            <p class="no-data">No outdoor boulders recorded.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                        <h3>🧗 Indoor Lead/Sport Grades</h3>
                        {#if indoorLeadGrades.length > 0}
                             <StackedBarChart 
                                data={indoorLeadGrades} 
                                xAccessor={d => d.label} 
                                keys={gradeStackKeys}
                                colors={gradeStackColors}
                                labels={gradeStackLabels}
                            />
                        {:else}
                            <p class="no-data">No indoor lead climbs recorded.</p>
                        {/if}
                    </div>

                    <div class="chart-card full-width">
                        <h3>⛰️ Outdoor Lead/Sport Grades</h3>
                        {#if outdoorLeadGrades.length > 0}
                             <StackedBarChart 
                                data={outdoorLeadGrades} 
                                xAccessor={d => d.label} 
                                keys={gradeStackKeys}
                                colors={gradeStackColors}
                                labels={gradeStackLabels}
                            />
                        {:else}
                            <p class="no-data">No outdoor sport climbs recorded.</p>
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
                                zAccessor={d => d.series}
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
                                zAccessor={d => d.series}
                                color="#3498DB"
                            />
                        {:else}
                            <p class="no-data">No max pick-ups recorded.</p>
                        {/if}
                    </div>
                 </div>
            {:else if selectedView === 'load'}
                <div class="chart-grid">
                    <!-- 7.1 Activities -->
                    <div class="chart-card full-width">
                        <h3>Climbing Sessions</h3>
                        {#if loadClimbing.length > 0}<LineChart data={loadClimbing} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Fingerboarding Sessions</h3>
                        {#if loadFingerboard.length > 0}<LineChart data={loadFingerboard} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Indoor Bouldering</h3>
                        {#if loadIndoorBoulder.length > 0}<LineChart data={loadIndoorBoulder} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Outdoor Bouldering</h3>
                        {#if loadOutdoorBoulder.length > 0}<LineChart data={loadOutdoorBoulder} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Indoor Leading</h3>
                        {#if loadIndoorLead.length > 0}<LineChart data={loadIndoorLead} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Outdoor Leading</h3>
                        {#if loadOutdoorLead.length > 0}<LineChart data={loadOutdoorLead} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Competitions</h3>
                        {#if loadComps.length > 0}<LineChart data={loadComps} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>

                    <!-- 7.2 Body Parts -->
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Shoulders</h3>
                        {#if loadShoulders.length > 0}<LineChart data={loadShoulders} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Forearms</h3>
                        {#if loadForearms.length > 0}<LineChart data={loadForearms} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Fingers</h3>
                        {#if loadFingers.length > 0}<LineChart data={loadFingers} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>

                    <!-- 7.3 Grips -->
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Open Grips</h3>
                        {#if loadOpen.length > 0}<LineChart data={loadOpen} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Crimps</h3>
                        {#if loadCrimp.length > 0}<LineChart data={loadCrimp} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Pinches</h3>
                        {#if loadPinch.length > 0}<LineChart data={loadPinch} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Slopers</h3>
                        {#if loadSloper.length > 0}<LineChart data={loadSloper} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
                    </div>
                    <div class="chart-card full-width">
                        <h3>Load Tracking - Jugs</h3>
                        {#if loadJug.length > 0}<LineChart data={loadJug} xAccessor={d => d.date} yAccessor={d => d.value} zAccessor={d => d.series} />{:else}<p class="no-data">No data.</p>{/if}
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
