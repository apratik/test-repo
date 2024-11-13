document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("exportButton").addEventListener("click", exportWorkflow);
document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
document.getElementById("copyJsonButton").addEventListener("click", copyWorkflowJSON);
document.getElementById("addNewComponentButton").addEventListener("click", addNewComponentType);

let workflowData = { workflowTasks: [] };
let nodes = [];
let links = [];

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
        createComponentButton(type);
    });
}

function createComponentButton(type) {
    const componentButtons = document.getElementById("componentButtons");

    const btn = document.createElement("button");
    btn.className = "component-button";
    btn.textContent = type;
    btn.addEventListener("click", () => addComponent(type));
    componentButtons.appendChild(btn);
}

function addNewComponentType() {
    const newTypeInput = document.getElementById("newComponentInput");
    const newType = newTypeInput.value.trim();

    if (newType && !workflowData.workflowTasks.some(task => task.type === newType)) {
        createComponentButton(newType);
        newTypeInput.value = "";
    } else {
        alert("Type already exists or input is empty.");
    }
}

function renderGraph() {
    d3.select("#graph").html(""); // Clear existing graph
    const svg = d3.select("#graph").append("svg").attr("width", 1000).attr("height", 600);

    // Set up hierarchical layout for flowchart style
    const hierarchyData = d3.stratify()
        .id(d => d.taskId)
        .parentId(d => d.prev)(workflowData.workflowTasks);

    // Layout settings (space between nodes, etc.)
    const treeLayout = d3.tree().size([1000, 500]).separation((a, b) => a.parent === b.parent ? 1 : 2);

    // Apply the tree layout to the data
    const treeData = treeLayout(hierarchyData);

    // Create nodes
    nodes = treeData.descendants();
    links = treeData.links();

    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", d => d.target.data.type === "success" ? "green" : "red")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    // Create node groups
    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", d => d.depth === 0 ? "blue" : d.depth === nodes.length - 1 ? "darkred" : "#3b8e8d");

    node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => `${d.data.name} (${d.data.type})`);

    // Define arrow markers
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 10)
        .attr("refY", 5)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 Z")
        .attr("fill", "black");

    // Simulation for dragging (optional)
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    function dragstarted(event, d) {
        if (!event.active) treeLayout.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) treeLayout.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function addComponent(type) {
    const newId = `task_${nodes.length + 1}`;
    workflowData.workflowTasks.push({
        taskId: newId, 
        type: type, 
        prev: nodes.length > 0 ? nodes[nodes.length - 1].data.taskId : null,
        nextOnSuccess: [], 
        nextOnFailure: []
    });
    nodes.push({ id: newId, type: type });
    renderGraph();
}

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

function copyWorkflowJSON() {
    navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2))
        .then(() => alert("Workflow JSON copied to clipboard"));
}
