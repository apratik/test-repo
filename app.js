document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("generateFlowButton").addEventListener("click", renderGraph);
document.getElementById("exportButton").addEventListener("click", exportWorkflow);
document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
document.getElementById("copyJsonButton").addEventListener("click", copyJson);

let workflowData = { workflowTasks: [] };
let nodes = [];
let links = [];
const colorMap = {}; // This will map each type to a specific color

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            workflowData = JSON.parse(e.target.result);
            generateComponentPanel();
            renderGraph();
        };
        reader.readAsText(file);
    }
}

function generateComponentPanel() {
    const uniqueTypes = Array.from(new Set(workflowData.workflowTasks.map(task => task.type)));
    const componentButtons = document.getElementById("componentButtons");
    componentButtons.innerHTML = "";

    uniqueTypes.forEach(type => {
        if (!colorMap[type]) {
            colorMap[type] = getColorForType(type);
        }
        createComponentButton(type);
    });
}

function getColorForType(type) {
    // Generate a consistent color for each type (you can change this logic as needed)
    const hash = Array.from(type).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `hsl(${hash % 360}, 70%, 60%)`; // Color based on hash of type
}

function createComponentButton(type) {
    const componentButtons = document.getElementById("componentButtons");
    const btn = document.createElement("button");
    btn.className = "component-button";
    btn.textContent = type;
    btn.style.backgroundColor = colorMap[type];
    componentButtons.appendChild(btn);
}

function renderGraph() {
    // Ensure nodes are created correctly from workflowData
    nodes = workflowData.workflowTasks.map(task => ({
        id: task.taskId,  // Ensuring that each node has a unique 'id'
        type: task.type,
        name: task.name
    }));

    // Ensure links are created correctly
    links = workflowData.workflowTasks.flatMap(task => [
        ...(task.prev ? [{ source: task.prev, target: task.taskId }] : []), // prev is null means start
        ...(task.nextOnSuccess && task.nextOnSuccess.length > 0 ? task.nextOnSuccess.map(next => ({ source: task.taskId, target: next })) : []), // nextOnSuccess null means end
        ...(task.nextOnFailure && task.nextOnFailure.length > 0 ? task.nextOnFailure.map(next => ({ source: task.taskId, target: next })) : []) // nextOnFailure null means end
    ]);

    // Check if nodes and links are correct before proceeding
    if (nodes.length === 0 || links.length === 0) {
        console.error("No valid nodes or links found!");
        return; // Exit if no valid nodes or links
    }

    const svg = d3.select("#graph").html("").append("svg")
        .attr("width", 2000)
        .attr("height", 1500)
        .append("g");

    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)");

    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag());

    node.append("rect")
        .attr("width", 120)
        .attr("height", 50)
        .attr("fill", d => colorMap[d.type]); // Color based on the type

    node.append("text")
        .attr("x", 60)
        .attr("y", 25)
        .attr("dy", "1.5em")
        .attr("text-anchor", "middle")
        .text(d => d.name);

    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 5)
        .attr("refY", 5)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 Z")
        .attr("fill", "#000");

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(1000, 750));

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x - 60},${d.y - 25})`);
    });
}

function exportWorkflow() {
    const json = JSON.stringify(workflowData, null, 2);
    alert(`Exported JSON:\n${json}`);
}

function downloadGraph() {
    const svgContent = d3.select("svg").node().outerHTML;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "workflow.svg";
    link.click();
}

function copyJson() {
    const json = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        alert("Workflow JSON copied to clipboard!");
    });
}
