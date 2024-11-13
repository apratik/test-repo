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
    d3.select("#graph").html("");
    const svg = d3.select("#graph").append("svg").attr("width", "2000px").attr("height", "1500px");

    nodes = workflowData.workflowTasks.map(task => ({
        id: task.taskId,
        type: task.type,
        name: task.name,
        prev: task.prev,
        nextOnSuccess: task.nextOnSuccess,
        nextOnFailure: task.nextOnFailure
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

    // Define nodes in a grid for structured layout
    let x = 100, y = 50, row = 0;
    nodes.forEach(node => {
        node.fx = x;
        node.fy = y;
        x += 200;
        if (x > 1800) {
            x = 100;
            y += 150;
        }
    });

    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", d => d.type === "success" ? "green" : "red")
        .attr("stroke-width", 2);

    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node");

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", "steelblue");

    node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => `${d.name} (${d.type})`);

    node.attr("transform", d => `translate(${d.fx},${d.fy})`);

    link.attr("x1", d => nodes.find(node => node.id === d.source).fx)
        .attr("y1", d => nodes.find(node => node.id === d.source).fy)
        .attr("x2", d => nodes.find(node => node.id === d.target).fx)
        .attr("y2", d => nodes.find(node => node.id === d.target).fy);
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
