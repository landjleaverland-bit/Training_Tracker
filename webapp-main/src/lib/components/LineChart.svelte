<script lang="ts">
	import * as d3 from 'd3';

	interface Props {
		data: any[];
		xAccessor: (d: any) => Date;
		yAccessor: (d: any) => number;
        zAccessor?: (d: any) => string; // Series accessor
		width?: number;
		height?: number;
		marginTop?: number;
		marginRight?: number;
		marginBottom?: number;
		marginLeft?: number;
		color?: string; // Fallback color if zAccessor not used
	}

	let {
		data,
		xAccessor,
		yAccessor,
        zAccessor,
		width = 640,
		height = 400,
		marginTop = 20,
		marginRight = 100, // Increased for legendary legend
		marginBottom = 30,
		marginLeft = 40,
		color = "steelblue"
	}: Props = $props();

	// Reactive dimensions
	let innerWidth = $derived(width - marginLeft - marginRight);
	let innerHeight = $derived(height - marginTop - marginBottom);

	// Scales
	let xScale = $derived(d3.scaleTime()
		.domain(d3.extent(data, xAccessor) as [Date, Date])
		.range([0, innerWidth]));

	let yScale = $derived(d3.scaleLinear()
		.domain([0, d3.max(data, yAccessor) as number])
		.range([innerHeight, 0])
		.nice());

    let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

	// Line Generator
	let lineGenerator = $derived(d3.line<any>()
		.x(d => xScale(xAccessor(d)))
		.y(d => yScale(yAccessor(d)))
		.curve(d3.curveMonotoneX));

    // Group data by series
    let series = $derived(zAccessor 
        ? d3.groups(data, zAccessor) 
        : [[null, data]] // Single series
    );

	// Ticks
	let xTicks = $derived(xScale.ticks(width / 80));
	let yTicks = $derived(yScale.ticks(height / 40));
</script>

<div class="chart-container" role="img" aria-label="Line chart">
	<svg {width} {height} viewBox="0 0 {width} {height}" style="max-width: 100%; height: auto;">
		<g transform="translate({marginLeft}, {marginTop})">
			<!-- X Axis -->
			<g transform="translate(0, {innerHeight})">
				<line x1="0" x2={innerWidth} stroke="currentColor" />
				{#each xTicks as tick}
					<g transform="translate({xScale(tick)}, 0)">
						<line y2="6" stroke="currentColor" />
						<text dy="0.71em" y="9" text-anchor="middle" fill="currentColor" font-size="10">
							{d3.timeFormat("%b %d")(tick)}
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
						<text x="-9" dy="0.32em" text-anchor="end" fill="currentColor" font-size="10">
							{tick}
						</text>
						<!-- Grid lines (optional) -->
						<line x2={innerWidth} stroke="currentColor" stroke-opacity="0.1" />
					</g>
				{/each}
			</g>

			<!-- Lines -->
            {#each series as [key, values]}
                <path
                    d={lineGenerator(values as any[]) ?? ""}
                    fill="none"
                    stroke={zAccessor && key ? colorScale(key as string) : color}
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            {/each}

            <!-- Legend (if multi-series) -->
            {#if zAccessor}
                <g transform="translate({innerWidth + 10}, 0)">
                    {#each series as [key, _], i}
                        <g transform="translate(0, {i * 20})">
                            <rect width="10" height="10" fill={colorScale(key as string)} rx="2"/>
                            <text x="15" y="9" font-size="10" fill="currentColor">{key}</text>
                        </g>
                    {/each}
                </g>
            {/if}
		</g>
	</svg>
</div>

<style>
	.chart-container {
		font-family: sans-serif;
	}
</style>
