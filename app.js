// Event listeners for buttons
document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("exportButton").addEventListener("click", exportWorkflow);
document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
document.getElementById("copyJsonButton").addEventListener("click", copyWorkflowJSON);
document.getElementById("addNewComponentButton").addEventListener("click", addNewComponentType);

let workflowData = { WorkflowTasks: [] };
let nodes = [];
let links = [];

// Handle JSON file upload
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

// Generate component panel buttons from unique types in workflow
function generateComponentPanel() {
    const uniqueTypes = Array.from(new Set(workflowData.WorkflowTasks.map(task => task.type)));
    const componentButtons = document.getElementById("componentButtons");
    componentButtons.innerHTML = ""; // Clear existing buttons

    uniqueTypes.forEach(type => {
        createComponentButton(type);
    });
}

// Create a button for a given component type and add it to the panel
function createComponentButton(type) {
    const componentButtons = document.getElementById("componentButtons");

    const btn = document.createElement("button");
    btn.className = "component-button";
    btn.textContent = type;
    btn.addEventListener("click", () => addComponent(type));
    componentButtons.appendChild(btn);
}

// Add a new component type to the panel
function addNewComponentType() {
    const newTypeInput = document.getElementById("newComponentInput");
    const newType = newTypeInput.value.trim();

    if (newType && !workflowData.WorkflowTasks.some(task => task.type === newType)) {
        createComponentButton(newType);
        newTypeInput.value = "";
    } else {
        alert("Type already exists or input is empty.");
    }
}

// Render the graph using D3
function renderGraph() {
    d3.select("#graph").html("");
    const svg = d3.select("#graph").append("svg").attr("width", 800).attr("height", 600);

    nodes = workflowData.WorkflowTasks.map(task => ({ id: task.taskId, type: task.type }));
    links = [];
    workflowData.WorkflowTasks.forEach(task => {
        if (task.nextOnSuccess) task.nextOnSuccess.forEach(n => links.push({ source: task.taskId, target: n, type: "success" }));
        if (task.nextOnFailure) task.nextOnFailure.forEach(n => links.push({ source: task.taskId, target: n, type: "failure" }));
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(400, 300));

    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", d => d.type === "success" ? "green" : "red")
        .attr("stroke-width", 2);

    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("rect")
        .attr("width", 100)
        .attr("height", 40)
        .attr("x", -50)
        .attr("y", -20);

    node.append("text")
        .attr("dy", ".35em")
        .text(d => `${d.id} (${d.type})`);

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Add new component to the graph
function addComponent(type) {
    const newId = `task_${nodes.length + 1}`;
    workflowData.WorkflowTasks.push({ taskId: newId, type: type, nextOnSuccess: [], nextOnFailure: [] });
    nodes.push({ id: newId, type: type });
    renderGraph();
}

// Export workflow as JSON
function exportWorkflow() {
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "updated_workflow.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Download visualization as an SVG image
function downloadGraph() {
    const svgData = new XMLSerializer().serializeToString(d3.select("svg").node());
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow_visualization.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Copy JSON to clipboard
function copyWorkflowJSON() {
    navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2))
        .then(() => alert("Workflow JSON copied to clipboard"));
}
