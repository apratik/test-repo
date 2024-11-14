document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("exportButton").addEventListener("click", exportWorkflow);
document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
document.getElementById("copyJsonButton").addEventListener("click", copyWorkflowJson);

let workflowData = null;

// Handle file upload and read JSON data
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            workflowData = JSON.parse(e.target.result);
            renderGraph(workflowData);
        } catch (error) {
            alert("Invalid JSON format. Please upload a valid workflow JSON file.");
            console.error("Error parsing JSON:", error);
        }
    };
    reader.readAsText(file);
}

// Render the workflow graph based on workflowData
function renderGraph(data) {
    const graphContainer = d3.select("#graph");
    graphContainer.html(""); // Clear previous graph
    const width = 1200, height = 800;

    const svg = graphContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    if (!data || !data.workflowTasks) {
        console.error("Invalid workflow data format");
        return;
    }

    const tasks = data.workflowTasks;

    // Define a color scale based on component type
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create nodes and links arrays
    const nodes = [];
    const links = [];

    tasks.forEach((task) => {
        nodes.push({ id: task.taskId, name: task.name, type: task.type });

        if (task.prev) {
            links.push({ source: task.prev, target: task.taskId, status: "prev" });
        }
        if (task.nextOnSuccess) {
            links.push({ source: task.taskId, target: task.nextOnSuccess, status: "success" });
        }
        if (task.nextOnFailure) {
            links.push({ source: task.taskId, target: task.nextOnFailure, status: "failure" });
        }
    });

    // Create simulation for node layout
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("stroke", d => d.status === "success" ? "green" : d.status === "failure" ? "red" : "gray")
        .attr("marker-end", "url(#arrow)");

    // Define arrow markers
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "black");

    // Draw nodes
    const node = svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node");

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("fill", d => colorScale(d.type))
        .attr("rx", 5)
        .attr("ry", 5);

    node.append("text")
        .attr("dx", 10)
        .attr("dy", 20)
        .text(d => d.type);

    node.append("text")
        .attr("dx", 10)
        .attr("dy", 35)
        .text(d => d.name)
        .attr("font-size", "12px");

    simulation.on("tick", () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        link.attr("x1", d => d.source.x + 60)
            .attr("y1", d => d.source.y + 20)
            .attr("x2", d => d.target.x + 60)
            .attr("y2", d => d.target.y + 20);
    });
}

// Export workflow data as JSON file
function exportWorkflow() {
    if (!workflowData) {
        alert("No workflow data to export.");
        return;
    }
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Download the SVG graph as an image file
function downloadGraph() {
    const svg = document.querySelector("#graph svg");
    if (!svg) {
        alert("No graph available to download.");
        return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow_graph.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Copy workflow JSON to clipboard
function copyWorkflowJson() {
    if (!workflowData) {
        alert("No workflow data to copy.");
        return;
    }
    navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2))
        .then(() => alert("Workflow JSON copied to clipboard."))
        .catch(err => console.error("Failed to copy workflow JSON:", err));
}
