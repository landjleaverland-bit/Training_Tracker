<script lang="ts">
	import * as d3 from 'd3';

	interface Props {
		data: any[];
		valueAccessor: (d: any) => number;
		labelAccessor: (d: any) => string;
        colorAccesor?: (d: any) => string;
		width?: number;
		height?: number;
	}

	let {
		data,
		valueAccessor,
		labelAccessor,
        colorAccesor,
		width = 300,
		height = 300,
	}: Props = $props();

    let radius = $derived(Math.min(width, height) / 2);
    let innerRadius = $derived(radius * 0.6); // Donut style

    let pie = $derived(d3.pie<any>()
        .value(valueAccessor)
        .sort(null));

    let arc = $derived(d3.arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(radius));

    let arcs = $derived(pie(data));
    
    // Default colors if no accessor provided
    let colorScale = d3.scaleOrdinal(d3.schemeTableau10);
</script>

<div class="chart-wrapper">
    <div class="chart-container" role="img" aria-label="Pie chart">
        <svg {width} {height} viewBox="{-width / 2} {-height / 2} {width} {height}" style="max-width: 100%; height: auto;">
            {#each arcs as a}
                {@const color = colorAccesor ? colorAccesor(a.data) : colorScale(labelAccessor(a.data))}
                <g>
                    <path d={arc(a)} fill={color} stroke="white" stroke-width="2" />
                </g>
            {/each}
            
            <!-- Center Text (Total or Title logic could go here, but keeping simple) -->
             <text text-anchor="middle" dy="0.35em" font-weight="bold" fill="#666">
                {d3.sum(data, valueAccessor)} Total
             </text>
        </svg>
    </div>

    <!-- External Legend -->
    <div class="legend">
        {#each data as d}
             {@const color = colorAccesor ? colorAccesor(d) : colorScale(labelAccessor(d))}
             <div class="legend-item">
                <span class="color-box" style="background-color: {color};"></span>
                <span class="label">{labelAccessor(d)}</span>
                <span class="value">({valueAccessor(d)})</span>
             </div>
        {/each}
    </div>
</div>

<style>
    .chart-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .chart-container {
        font-family: sans-serif;
        display: flex;
        justify-content: center;
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--text-primary, #333);
        background: rgba(255,255,255,0.5);
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid rgba(0,0,0,0.05);
    }

    .color-box {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        display: inline-block;
    }
    
    .value {
        font-weight: 600;
        color: var(--text-secondary, #666);
    }
</style>
