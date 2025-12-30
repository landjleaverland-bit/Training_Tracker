<script lang="ts">
	import * as d3 from 'd3';

	interface Props {
		data: any[];
		xAccessor: (d: any) => Date;
		yAccessor: (d: any) => number;
		width?: number;
		height?: number;
		marginTop?: number;
		marginRight?: number;
		marginBottom?: number;
		marginLeft?: number;
		color?: string;
	}

	let {
		data,
		xAccessor,
		yAccessor,
		width = 640,
		height = 400,
		marginTop = 20,
		marginRight = 20,
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

	// Line Generator
	let lineGenerator = $derived(d3.line<any>()
		.x(d => xScale(xAccessor(d)))
		.y(d => yScale(yAccessor(d)))
		.curve(d3.curveMonotoneX));

	// Path data
	let pathD = $derived(lineGenerator(data) ?? "");

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

			<!-- Line Path -->
			<path
				d={pathD}
				fill="none"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</g>
	</svg>
</div>

<style>
	.chart-container {
		font-family: sans-serif;
	}
</style>
