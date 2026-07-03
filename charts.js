// Small, dependency-free SVG chart helpers.
// Each chart is a single series (one measure), so it always uses one hue —
// color is only used for identity when there are multiple series, which
// none of these charts have.

const CHART_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(CHART_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

// One shared tooltip element, reused by every chart.
const tooltip = document.createElement("div");
tooltip.className = "chart-tooltip";
tooltip.hidden = true;
document.body.appendChild(tooltip);

function showTooltip(evt, lines) {
  tooltip.innerHTML = lines
    .map((line, i) => (i === 0 ? `<strong>${line}</strong>` : `<span>${line}</span>`))
    .join("");
  tooltip.hidden = false;
  moveTooltip(evt);
}

function moveTooltip(evt) {
  const x = evt.clientX ?? 0;
  const y = evt.clientY ?? 0;
  tooltip.style.left = `${x + 14}px`;
  tooltip.style.top = `${y + 14}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

// ---------- Chart card scaffold (title + table-view toggle) ----------

function buildChartCard(container, title, tableRows, tableHeaders) {
  container.innerHTML = "";

  const header = document.createElement("div");
  header.className = "chart-card-header";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "table-toggle";
  toggle.textContent = "View as table";

  header.appendChild(heading);
  header.appendChild(toggle);

  const body = document.createElement("div");
  body.className = "chart-body";

  const table = document.createElement("table");
  table.className = "chart-table";
  table.hidden = true;

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const h of tableHeaders) {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of tableRows) {
    const tr = document.createElement("tr");
    for (const cell of row) {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  toggle.addEventListener("click", () => {
    const showingTable = !table.hidden;
    table.hidden = showingTable;
    body.hidden = !showingTable;
    toggle.textContent = showingTable ? "View as table" : "View as chart";
  });

  container.appendChild(header);
  container.appendChild(body);
  container.appendChild(table);

  return body;
}

// ---------- Horizontal bar chart (top genres, top artists) ----------

function renderHorizontalBarChart(container, { title, items, formatValue = (v) => v }) {
  const tableRows = items.map((d) => [d.label, formatValue(d.value)]);
  const body = buildChartCard(container, title, tableRows, ["Name", "Count"]);

  const width = 380;
  const rowHeight = 28;
  const barHeight = 16;
  const leftLabelWidth = 130;
  const rightPadding = 46;
  const height = items.length * rowHeight + 10;
  const maxValue = Math.max(...items.map((d) => d.value));
  const plotWidth = width - leftLabelWidth - rightPadding;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg",
    role: "img",
    "aria-label": title,
  });

  items.forEach((d, i) => {
    const y = i * rowHeight + 5;
    const barWidth = Math.max(2, (d.value / maxValue) * plotWidth);

    const label = svgEl("text", {
      x: leftLabelWidth - 10,
      y: y + barHeight / 2 + 4,
      class: "chart-label",
      "text-anchor": "end",
    });
    label.textContent = d.label;
    svg.appendChild(label);

    const bar = svgEl("rect", {
      x: leftLabelWidth,
      y,
      width: barWidth,
      height: barHeight,
      rx: 4,
      class: "chart-bar",
      tabindex: "0",
      role: "img",
      "aria-label": `${d.label}: ${formatValue(d.value)}`,
    });
    svg.appendChild(bar);

    // Only the top (first, largest) bar gets a direct value label.
    if (i === 0) {
      const valueLabel = svgEl("text", {
        x: leftLabelWidth + barWidth + 8,
        y: y + barHeight / 2 + 4,
        class: "chart-value-label",
      });
      valueLabel.textContent = formatValue(d.value);
      svg.appendChild(valueLabel);
    }

    const onEnter = (evt) => {
      bar.classList.add("is-hovered");
      showTooltip(evt, [d.label, `${formatValue(d.value)} albums`]);
    };
    const onLeave = () => {
      bar.classList.remove("is-hovered");
      hideTooltip();
    };
    bar.addEventListener("pointermove", (evt) => {
      onEnter(evt);
      moveTooltip(evt);
    });
    bar.addEventListener("pointerleave", onLeave);
    bar.addEventListener("focus", (evt) => onEnter(evt));
    bar.addEventListener("blur", onLeave);
  });

  body.appendChild(svg);
}

// ---------- Vertical bar chart (albums by year) ----------

function renderVerticalBarChart(container, { title, items, formatValue = (v) => v }) {
  const tableRows = items.map((d) => [d.label, formatValue(d.value)]);
  const body = buildChartCard(container, title, tableRows, ["Year", "Albums"]);

  const width = 380;
  const height = 200;
  const bottomAxis = 26;
  const topPadding = 26;
  const plotHeight = height - bottomAxis - topPadding;
  const maxValue = Math.max(...items.map((d) => d.value));
  const colWidth = width / items.length;
  const barWidth = Math.min(24, colWidth - 10);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg",
    role: "img",
    "aria-label": title,
  });

  // Baseline
  svg.appendChild(
    svgEl("line", {
      x1: 0,
      x2: width,
      y1: height - bottomAxis,
      y2: height - bottomAxis,
      class: "chart-baseline",
    })
  );

  const maxIndex = items.reduce((best, d, i) => (d.value > items[best].value ? i : best), 0);

  items.forEach((d, i) => {
    const barHeight = Math.max(2, (d.value / maxValue) * plotHeight);
    const x = i * colWidth + (colWidth - barWidth) / 2;
    const y = height - bottomAxis - barHeight;

    const bar = svgEl("rect", {
      x,
      y,
      width: barWidth,
      height: barHeight,
      rx: 4,
      class: "chart-bar",
      tabindex: "0",
      role: "img",
      "aria-label": `${d.label}: ${formatValue(d.value)}`,
    });
    svg.appendChild(bar);

    if (i === maxIndex) {
      const valueLabel = svgEl("text", {
        x: x + barWidth / 2,
        y: y - 8,
        class: "chart-value-label",
        "text-anchor": "middle",
      });
      valueLabel.textContent = formatValue(d.value);
      svg.appendChild(valueLabel);
    }

    const xLabel = svgEl("text", {
      x: x + barWidth / 2,
      y: height - bottomAxis + 16,
      class: "chart-label",
      "text-anchor": "middle",
    });
    xLabel.textContent = d.label;
    svg.appendChild(xLabel);

    const onEnter = (evt) => {
      bar.classList.add("is-hovered");
      showTooltip(evt, [d.label, `${formatValue(d.value)} albums`]);
    };
    const onLeave = () => {
      bar.classList.remove("is-hovered");
      hideTooltip();
    };
    bar.addEventListener("pointermove", (evt) => {
      onEnter(evt);
      moveTooltip(evt);
    });
    bar.addEventListener("pointerleave", onLeave);
    bar.addEventListener("focus", (evt) => onEnter(evt));
    bar.addEventListener("blur", onLeave);
  });

  body.appendChild(svg);
}

// ---------- Line chart (average score by year) ----------

function renderLineChart(container, { title, items, formatValue = (v) => v.toFixed(1) }) {
  const tableRows = items.map((d) => [d.label, formatValue(d.value)]);
  const body = buildChartCard(container, title, tableRows, ["Year", "Avg. score"]);

  const width = 380;
  const height = 200;
  const bottomAxis = 26;
  const topPadding = 26;
  const leftPadding = 8;
  const rightPadding = 40;
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - bottomAxis - topPadding;

  const values = items.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const pad = (maxValue - minValue) * 0.15 || 1;
  const yMin = minValue - pad;
  const yMax = maxValue + pad;

  const xFor = (i) => leftPadding + (i / (items.length - 1)) * plotWidth;
  const yFor = (v) => topPadding + (1 - (v - yMin) / (yMax - yMin)) * plotHeight;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg",
    role: "img",
    "aria-label": title,
  });

  // Baseline
  svg.appendChild(
    svgEl("line", {
      x1: 0,
      x2: width,
      y1: height - bottomAxis,
      y2: height - bottomAxis,
      class: "chart-baseline",
    })
  );

  const points = items.map((d, i) => [xFor(i), yFor(d.value)]);
  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

  svg.appendChild(svgEl("path", { d: pathD, class: "chart-line" }));

  // Invisible crosshair hit-area covering the full plot, snaps to nearest point.
  const hitArea = svgEl("rect", {
    x: 0,
    y: 0,
    width,
    height: height - bottomAxis,
    fill: "transparent",
  });

  const crosshair = svgEl("line", {
    class: "chart-crosshair",
    y1: topPadding,
    y2: height - bottomAxis,
    hidden: true,
  });
  svg.appendChild(crosshair);

  items.forEach((d, i) => {
    const [x, y] = points[i];

    // Surface ring behind the colored dot.
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 6, class: "chart-dot-ring" }));
    const dot = svgEl("circle", { cx: x, cy: y, r: 4, class: "chart-dot" });
    svg.appendChild(dot);

    const xLabel = svgEl("text", {
      x,
      y: height - bottomAxis + 16,
      class: "chart-label",
      "text-anchor": "middle",
    });
    xLabel.textContent = d.label;
    svg.appendChild(xLabel);

    // Direct label only on the last (most recent) point.
    if (i === items.length - 1) {
      const valueLabel = svgEl("text", {
        x: x + 8,
        y: y + 4,
        class: "chart-value-label",
      });
      valueLabel.textContent = formatValue(d.value);
      svg.appendChild(valueLabel);
    }
  });

  hitArea.addEventListener("pointermove", (evt) => {
    const rect = hitArea.ownerSVGElement.getBoundingClientRect();
    const scaleX = width / rect.width;
    const pointerX = (evt.clientX - rect.left) * scaleX;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach(([x], i) => {
      const dist = Math.abs(x - pointerX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    const [x] = points[nearest];
    crosshair.setAttribute("x1", x);
    crosshair.setAttribute("x2", x);
    crosshair.removeAttribute("hidden");
    showTooltip(evt, [items[nearest].label, `Avg score: ${formatValue(items[nearest].value)}`]);
  });
  hitArea.addEventListener("pointerleave", () => {
    crosshair.setAttribute("hidden", "true");
    hideTooltip();
  });

  svg.appendChild(hitArea);
  body.appendChild(svg);
}
