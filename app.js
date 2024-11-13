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
    d3.select("#graph").html(""); // Clear previous graph
    const svg = d3.select("#graph").append("svg").attr("width", 800).attr("height", 600);

    nodes = workflowData.workflowTasks.map(task => ({
        id: task.taskId,
        type: task.type,
        name: task.name,
        isStart: task.prev === null,         // Identify start node
        isEnd: !task.nextOnSuccess && !task.nextOnFailure // Identify end node
    }));

    links = [];
    const taskIds = new Set(nodes.map(node => node.id));

    workflowData.workflowTasks.forEach(task => {
        if (task.nextOnSuccess) {
            task.nextOnSuccess.forEach(n => {
                if (taskIds.has(n)) {
                    links.push({ source: task.taskId, target: n, type: "success" });
                }
            });
        }
        if (task.nextOnFailure) {
            task.nextOnFailure.forEach(n => {
                if (taskIds.has(n)) {
                    links.push({ source: task.taskId, target: n, type: "failure" });
                }
            });
        }
    });

    // Build a tree structure to organize nodes hierarchically
    const root = { name: 'root', children: [] };
    const nodeMap = {};

    nodes.forEach(node => {
        nodeMap[node.id] = node;
    });

    nodes.forEach(node => {
        const newNode = { name: node.name, id: node.id, parent: node.prev ? nodeMap[node.prev] : root };
        (newNode.parent.children || (newNode.parent.children = [])).push(newNode);
    });

    const treeLayout = d3.tree().size([800, 600]).separation(function(a, b) { return a.parent === b.parent ? 1 : 3; });

    const nodesData = treeLayout(root).descendants();  // Use d3.tree() for hierarchical layout
    const linksData = treeLayout(root).links();  // Use d3.tree() for hierarchical links

    const link = svg.selectAll(".link")
        .data(linksData)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", d => d.type === "success" ? "green" : "red")
        .attr("stroke-width", 2);

    const node = svg.selectAll(".node")
        .data(nodesData)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", d => {
            // Special styling for start and end nodes
            if (d.id === "root") return "blue"; // Start node
            return "#3b8e8d"; // Regular middle nodes
        });

    node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => `${d.name}`);

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

function addComponent(type) {
    const newId = `task_${nodes.length + 1}`;
    const newNode = { 
        id: newId, 
        type: type, 
        name: type,  // Assign a default name or modify as needed
        prev: null, 
        nextOnSuccess: [], 
        nextOnFailure: [] 
    };

    // If there are existing tasks, we can set the prev and next properties
    if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1]; // Get the last node
        lastNode.nextOnSuccess.push(newId); // Link the new task to the last node
        newNode.prev = lastNode.id; // Set the new node's prev property
    }

    // Add the new node to the workflow data
    workflowData.workflowTasks.push({ taskId: newId, type: type, prev: null, nextOnSuccess: [], nextOnFailure: [] });
    
    // Add the new node to the nodes array
    nodes.push(newNode);
    
    // Re-render the graph after adding the new component
    renderGraph();
}

function exportWorkflow() {
    const dataStr = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
}

function copyWorkflowJSON() {
    const dataStr = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
        alert("Workflow copied to clipboard!");
    });
}

function downloadGraph() {
    const svg = document.querySelector("#graph svg");
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const svgBlob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.svg";
    a.click();
    URL.revokeObjectURL(url);
}
