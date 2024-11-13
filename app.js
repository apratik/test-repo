document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("generateFlowButton").addEventListener("click", renderGraph);
document.getElementById("addNewComponentButton").addEventListener("click", showAddComponentPopup);
document.getElementById("addComponentToGraphButton").addEventListener("click", addComponentToGraph);
document.getElementById("cancelAddComponentButton").addEventListener("click", hideAddComponentPopup);

let workflowData = { workflowTasks: [] };
let nodes = [];
let links = [];
const colorMap = new Map();

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
        if (!colorMap.has(type)) {
            colorMap.set(type, `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`);
        }
        createComponentButton(type);
    });
}

function createComponentButton(type) {
    const componentButtons = document.getElementById("componentButtons");
    const btn = document.createElement("button");
    btn.className = "component-button";
    btn.textContent = type;
    btn.style.backgroundColor = colorMap.get(type);
    btn.addEventListener("click", () => addComponent(type));
    componentButtons.appendChild(btn);
}

function showAddComponentPopup() {
    document.getElementById("addComponentPopup").style.display = "block";
}

function hideAddComponentPopup() {
    document.getElementById("addComponentPopup").style.display = "none";
}

function addComponentToGraph() {
    const taskName = document.getElementById("taskName").value;
    const componentType = document.getElementById("componentType").value;
    const prevTask = document.getElementById("prevTask").value;
    const nextSuccess = document.getElementById("nextSuccess").value;
    const nextFailure = document.getElementById("nextFailure").value;

    const newTask = {
        taskId: "T" + (workflowData.workflowTasks.length + 1),
        name: taskName,
        type: componentType,
        prev: prevTask || null,
        nextOnSuccess: nextSuccess ? [nextSuccess] : [],
        nextOnFailure: nextFailure ? [nextFailure] : []
    };

    workflowData.workflowTasks.push(newTask);
    hideAddComponentPopup();
    renderGraph();
}

function renderGraph() {
    nodes = workflowData.workflowTasks.map(task => ({ id: task.taskId, type: task.type, name: task.name }));
    links = workflowData.workflowTasks.flatMap(task => [
        ...(task.prev ? [{ source: task.prev, target: task.taskId }] : []),
        ...task.nextOnSuccess.map(next => ({ source: task.taskId, target: next })),
        ...task.nextOnFailure.map(next => ({ source: task.taskId, target: next }))
    ]);

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
        .attr("width", 100)
        .attr("height", 50)
        .attr("fill", d => colorMap.get(d.type));

    node.append("text")
        .attr("x", 50)
        .attr("y", 25)
        .attr("dy", "1.5em")
        .attr("text-anchor", "middle")
        .text(d => d.name);

    node.append("text")
        .attr("x", 50)
        .attr("y", 40)
        .attr("dy", "3em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d.id);

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
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(1000, 750));

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x - 50},${d.y - 25})`);
    });
}
