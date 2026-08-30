type ReadinessDimension = {
  label: string;
  value: number;
};

const center = 120;
const radius = 78;

export function ReadinessRadarChart({
  dimensions,
}: {
  dimensions: ReadinessDimension[];
}) {
  const gridLevels = [25, 50, 75, 100];
  const dataPoints = dimensions
    .map((dimension, index) => point(index, dimensions.length, dimension.value))
    .join(" ");

  return (
    <figure aria-labelledby="readiness-chart-title">
      <div className="mx-auto max-w-72">
        <svg
          aria-describedby="readiness-chart-description"
          className="h-auto w-full"
          role="img"
          viewBox="0 0 240 240"
        >
          <title id="readiness-chart-title">Readiness balance</title>
          <desc id="readiness-chart-description">
            A radar chart comparing six preparation dimensions from zero to one
            hundred. Exact values follow the chart.
          </desc>
          {gridLevels.map((level) => (
            <polygon
              className="stroke-border fill-none"
              key={level}
              points={dimensions
                .map((_, index) => point(index, dimensions.length, level))
                .join(" ")}
              strokeWidth="1"
            />
          ))}
          {dimensions.map((_, index) => {
            const endpoint = point(index, dimensions.length, 100);
            return (
              <line
                className="stroke-border"
                key={index}
                x1={center}
                x2={endpoint.split(",")[0]}
                y1={center}
                y2={endpoint.split(",")[1]}
              />
            );
          })}
          <polygon
            className="fill-primary/20 stroke-primary"
            points={dataPoints}
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {dimensions.map((dimension, index) => {
            const [x, y] = point(index, dimensions.length, dimension.value)
              .split(",")
              .map(Number);
            return (
              <circle
                className="fill-primary stroke-surface"
                cx={x}
                cy={y}
                key={dimension.label}
                r="4"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {dimensions.map((dimension) => (
          <span
            className="flex items-center justify-between gap-2"
            key={dimension.label}
          >
            <span className="text-muted truncate">{dimension.label}</span>
            <strong>{Math.round(dimension.value)}</strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function point(index: number, count: number, value: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const distance = radius * (Math.max(0, Math.min(100, value)) / 100);
  const x = center + Math.cos(angle) * distance;
  const y = center + Math.sin(angle) * distance;
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}
