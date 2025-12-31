<script lang="ts">
	import * as d3 from 'd3';

	interface Props {
		data: any[];
		xAccessor: (d: any) => string;
		keys: string[]; // Keys for the stack (e.g., ['flash', 'redpoint', 'dnf'])
        colors: string[]; // Colors corresponding to keys
        labels?: string[]; // Optional legend labels corresponding to keys
		width?: number;
		height?: number;
		marginTop?: number;
		marginRight?: number;
		marginBottom?: number;
		marginLeft?: number;
	}

	let {
		data,
		xAccessor,
		keys,
        colors,
        labels,
		width = 640,
		height = 400,
		marginTop = 20,
		marginRight = 20,
		marginBottom = 60,
		marginLeft = 40,
	}: Props = $props();

    // Use keys as labels if no explicit labels provided
    let legendLabels = $derived(labels || keys.map(k => k.charAt(0).toUpperCase() + k.slice(1)));

	let innerWidth = $derived(width - marginLeft - marginRight);
	let innerHeight = $derived(height - marginTop - marginBottom);
    let fontSize = 12;

    // Scales
    let xScale = $derived(d3.scaleBand()
        .domain(data.map(xAccessor))
        .range([0, innerWidth])
        .padding(0.2)
    );

    // Calculate max Y for stack
    let yMax = $derived.by(() => {
        if (data.length === 0) return 0;
        // Sum of all keys for each item
        const maxVal = d3.max(data, d => {
            return keys.reduce((acc, k) => acc + (d[k] || 0), 0);
        });
        return maxVal || 10;
    });

    let yScale = $derived(d3.scaleLinear()
        .domain([0, yMax])
        .range([innerHeight, 0])
        .nice()
    );

    let colorScale = $derived(d3.scaleOrdinal<string>()
        .domain(keys)
        .range(colors)
    );

    // Compute stack
    let stackedData = $derived(d3.stack().keys(keys)(data as any));

    let xTicks = $derived(xScale.domain());
    let yTicks = $derived(yScale.ticks(5));

</script>

<div class="chart-container" role="img" aria-label="Stacked Bar chart">
    <!-- Legend -->
    <div class="legend">
        {#each keys as key, i}
             <div class="legend-item">
                <div class="legend-color" style="background-color: {colors[i]};"></div>
                <span class="legend-label">{legendLabels[i]}</span>
             </div>
        {/each}
    </div>

	<svg {width} {height} viewBox="0 0 {width} {height}" style="max-width: 100%; height: auto;">
		<g transform="translate({marginLeft}, {marginTop})">
			<!-- X Axis -->
			<g transform="translate(0, {innerHeight})">
                <line x1="0" x2={innerWidth} stroke="currentColor" />
				{#each xTicks as tick}
					<g transform="translate({(xScale(tick) || 0) + xScale.bandwidth() / 2}, 0)">
                        <line y2="6" stroke="currentColor" />
                        <text dy="0.71em" y="9" text-anchor="middle" fill="currentColor" font-size={fontSize}>
                           {tick}
                       </text>
					</g>
				{/each}
			</g>

			<!-- Y Axis -->
			<g>
                <line y2={innerHeight} stroke="currentColor" />
				{#each yTicks as tick}
					<g transform="translate(0, {yScale(tick)})">
					    <line x2="-6" stroke="currentColor" />
					    <text x="-9" dy="0.32em" text-anchor="end" fill="currentColor" font-size={fontSize}>
					    	{tick}
					    </text>
                        <line x2={innerWidth} stroke="currentColor" stroke-opacity="0.1" />
					</g>
				{/each}
			</g>

			<!-- Bars -->
            {#each stackedData as layer}
                {#each layer as d}
                    <!-- d[0] is baseline, d[1] is topline, d.data is original object -->
                     {@const xVal = xAccessor(d.data)}
                     {@const xPos = xScale(xVal) || 0}
                     {@const yTop = yScale(d[1])}
                     {@const yBottom = yScale(d[0])}
                     {@const barHeight = yBottom - yTop}
                    
                    <rect
                        x={xPos}
                        y={yTop}
                        width={xScale.bandwidth()}
                        height={barHeight}
                        fill={colorScale(layer.key)}
                        rx="1"
                    />
                {/each}
            {/each}
		</g>
	</svg>
</div>

<style>
	.chart-container {
		font-family: sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
	}

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 0.5rem;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.85rem;
        color: #555;
    }

    .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
    }
</style>
