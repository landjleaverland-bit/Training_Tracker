<script lang="ts">
	import * as d3 from 'd3';

	interface Props {
		data: any[];
		xAccessor: (d: any) => string;
		yAccessor: (d: any) => number;
		width?: number;
		height?: number;
		marginTop?: number;
		marginRight?: number;
		marginBottom?: number;
		marginLeft?: number;
		color?: string;
        orientation?: 'vertical' | 'horizontal';
	}

	let {
		data,
		xAccessor,
		yAccessor,
		width = 640,
		height = 400,
		marginTop = 20,
		marginRight = 20,
		marginBottom = 60,
		marginLeft = 40,
		color = "steelblue",
        orientation = 'vertical'
	}: Props = $props();

	let innerWidth = $derived(width - marginLeft - marginRight);
	let innerHeight = $derived(height - marginTop - marginBottom);

    // Dynamic font size based on width if needed, but for now just bump base size
    let fontSize = 12;

    let isVertical = $derived(orientation === 'vertical');

    // Scales - using 'any' to avoid complex union type issues with d3 scales
    let xScaleVideo = $derived(isVertical 
        ? d3.scaleBand()
            .domain(data.map(xAccessor))
            .range([0, innerWidth])
            .padding(0.2)
        : d3.scaleLinear()
            .domain([0, d3.max(data, yAccessor) as number])
            .range([0, innerWidth])
    );

    let yScaleVideo = $derived(isVertical
        ? d3.scaleLinear()
            .domain([0, d3.max(data, yAccessor) as number])
            .range([innerHeight, 0])
            .nice()
        : d3.scaleBand()
            .domain(data.map(xAccessor))
            .range([0, innerHeight])
            .padding(0.2)
    );

    let bars = $derived(data.map(d => {
        const xVal = xAccessor(d);
        const yVal = yAccessor(d);
        
        // Cast to any to access scale methods regardless of specific type
        const xs = xScaleVideo as any;
        const ys = yScaleVideo as any;

        return {
            x: isVertical ? xs(xVal) : 0,
            y: isVertical ? ys(yVal) : ys(xVal),
            width: isVertical ? xs.bandwidth() : xs(yVal),
            height: isVertical ? innerHeight - ys(yVal) : ys.bandwidth(),
            label: xVal,
            value: yVal
        };
    }));

	let xTicks = $derived(isVertical ? (xScaleVideo as any).domain() : (xScaleVideo as any).ticks(5));
	let yTicks = $derived(isVertical ? (yScaleVideo as any).ticks(5) : (yScaleVideo as any).domain());

</script>

<div class="chart-container" role="img" aria-label="Bar chart">
	<svg {width} {height} viewBox="0 0 {width} {height}" style="max-width: 100%; height: auto;">
		<g transform="translate({marginLeft}, {marginTop})">
			<!-- X Axis -->
			<g transform="translate(0, {innerHeight})">
                <line x1="0" x2={innerWidth} stroke="currentColor" />
				{#each xTicks as tick}
                    {@const xTickScale = xScaleVideo as any}
                    {@const xPos = isVertical ? (xTickScale(tick) || 0) + xTickScale.bandwidth() / 2 : xTickScale(tick)}
					<g transform="translate({xPos}, 0)">
						{#if isVertical}
                            <!-- Vertical Bars -> Horizontal X labels -->
                            <text dy="0.71em" y="9" text-anchor="end" transform="rotate(-45)" fill="currentColor" font-size={fontSize}>
                                {tick}
                            </text>
                        {:else}
                             <line y2="6" stroke="currentColor" />
                             <text dy="0.71em" y="9" text-anchor="middle" fill="currentColor" font-size={fontSize}>
                                {tick}
                            </text>
                        {/if}
					</g>
				{/each}
			</g>

			<!-- Y Axis -->
			<g>
                <line y2={innerHeight} stroke="currentColor" />
				{#each yTicks as tick}
                    {@const yTickScale = yScaleVideo as any}
                    {@const yPos = isVertical ? yTickScale(tick) : (yTickScale(tick) || 0) + yTickScale.bandwidth()/2}
					<g transform="translate(0, {yPos})">
                        {#if isVertical}
						    <line x2="-6" stroke="currentColor" />
						    <text x="-9" dy="0.32em" text-anchor="end" fill="currentColor" font-size={fontSize}>
						    	{tick}
						    </text>
                            <line x2={innerWidth} stroke="currentColor" stroke-opacity="0.1" />
                        {:else}
                             <text x="-9" dy="0.32em" text-anchor="end" fill="currentColor" font-size={fontSize}>
                                {tick}
                            </text>
                        {/if}
					</g>
				{/each}
			</g>

			<!-- Bars -->
            {#each bars as bar}
                <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={color}
                    rx="4"
                />
            {/each}
		</g>
	</svg>
</div>

<style>
	.chart-container {
		font-family: sans-serif;
	}
</style>
